import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import fs from 'fs'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { envConfig, isProduction } from '~/utils/config'
import { EncodingStatus, MediaType } from '~/constants/enum'
import { Media } from '~/models/Other'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import databaseService from '~/services/database.services'
import { VideoStatus } from '~/models/schemas/VideoStatus.schema'
class Queue {
  item: string[]
  encoding: boolean
  constructor() {
    this.item = []
    this.encoding = false
  }

  async enqueue(item: string) {
    this.item.push(item)
    const nameID = getNameFromFullName(item.split('/').pop() as string)
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: nameID,
        status: EncodingStatus.Pending
      })
    )
    this.processEncode()
  }

  async processEncode() {
    if (this.encoding) return
    if (this.item.length > 0) {
      this.encoding = true
      const videoPath = this.item[0]
      const nameID = getNameFromFullName(videoPath.split('/').pop() as string)
      await databaseService.videoStatus.updateOne(
        {
          name: nameID
        },
        {
          $set: {
            status: EncodingStatus.Processing
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.item.shift()
        await fs.unlinkSync(videoPath)
        await databaseService.videoStatus.updateOne(
          {
            name: nameID
          },
          {
            $set: {
              status: EncodingStatus.Success
            },
            $currentDate: {
              updated_at: true
            }
          }
        )
        console.log('Encode Video Done ', videoPath)
      } catch (error) {
        console.log('Encode Video Error: ' + error)
        await databaseService.videoStatus
          .updateOne(
            {
              name: nameID
            },
            {
              $set: {
                status: EncodingStatus.Failed
              },
              $currentDate: {
                updated_at: true
              }
            }
          )
          .catch((err) => {
            console.log('Update Video Status Error: ' + err)
          })
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log('Encode Video Queue Empty')
    }
  }
}
const queue = new Queue()
class MediaService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req) // hàm này giúp lưu ảnh ở temp để tiến hành xử lý
    const result: Media[] = await Promise.all(files.map(async (file) => {
      const newName = getNameFromFullName(file.newFilename) // lấy tên file bỏ đuôi extension để chuẩn bị đổi tên dòng newPath
      const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)// đây là đường dẫn đến file upload
      if (!file.newFilename.toLowerCase().endsWith('.jpg')) {
        await sharp(file.filepath).jpeg().toFile(newPath) // Nếu tệp không phải .jpg, chuyển đổi nó thành .jpg bằng sharp
        fs.unlinkSync(file.filepath)
      } else {
        fs.renameSync(file.filepath, newPath) // Nếu tệp là.jpg, chỉ cần chuyển tệp tạm về đích mà không cần xử lý lại
      }
      return {
        url: isProduction ? `${envConfig.HOST}/static/image/${newName}.jpg` : `http://localhost:${envConfig.PORT}/static/image/${newName}.jpg`,
        type: MediaType.Image
      }
    }))
    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const result = files.map((file) => {
      const folder = getNameFromFullName(file.newFilename)
      return {
        url: isProduction
          ? `${envConfig.HOST}/static/video/${folder}/${file.newFilename}`
          : `http://localhost:${envConfig.PORT}/static/video/${folder}/${file.newFilename}`,
        type: MediaType.Video
      }
    })
    return result
  }

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req)
    const result = await Promise.all(
      files.map(async (file) => {
        queue.enqueue(file.filepath)
        const folder = getNameFromFullName(file.newFilename)
        return {
          url: isProduction
            ? `${envConfig.HOST}/static/video-hls/${folder}/${file.newFilename}`
            : `http://localhost:${envConfig.PORT}/static/video-hls/${folder}/${file.newFilename}`,
          type: MediaType.Video
        }
      })
    )
    return result
  }

  async getVideoStatus(id: string) {
    const db = await databaseService.videoStatus.findOne({
      name: id
    })
    return db
  }
}
const mediaService = new MediaService()
export default mediaService

