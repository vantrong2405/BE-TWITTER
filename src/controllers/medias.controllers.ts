import { NextFunction, Response, Request } from "express";
import path from "path";
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from "~/constants/dir";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/message";
import mediaService from "~/services/medias.services";
import fs from 'fs'
import mime from 'mime'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaService.uploadImage(req);
  return res.json({
    message: USERS_MESSAGES.UPLOAD_IMAGE_SUCCESS,
    result: url
  })
}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaService.uploadVideo(req);
  return res.json({
    message: USERS_MESSAGES.UPLOAD_VIDEO_SUCCESS,
    result: url
  })
}

export const uploadVideoHLSController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaService.uploadVideoHLS(req);
  return res.json({
    message: USERS_MESSAGES.UPLOAD_VIDEO_SUCCESS,
    result: url
  })
}

export const serveImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      res.status((err as any).status).json({
        message: USERS_MESSAGES.VIDEO_NOT_FOUND
      })
    }
  })
}
export const serveVideoController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, name), (err) => {
    if (err) {
      if (!res.headersSent) {
        res.status((err as any).status).json({
          message: USERS_MESSAGES.VIDEO_NOT_FOUND
        });
      }
    }
  })
}

export const serveVideoStreamController = (req: Request, res: Response, next: NextFunction) => {
  const range = req.headers.range;
  if (!range) res.status(HTTP_STATUS.NOTFOUND).send('Requires Range header');
  const { name } = req.params;
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name);
  // Kiểm tra sự tồn tại của tệp video
  if (!fs.existsSync(videoPath)) res.status(HTTP_STATUS.NOTFOUND).send('Video not found');
  // Dung lượng video (bytes)
  const videoSize = fs.statSync(videoPath).size;
  // Dung lượng vdeo cho mỗi phân đoạn stream (30MB)
  const chunkSize = 30 * 10 ** 6;
  // Lấy giá trị byte bắt đầu từ headers Range (vd: bytes=0-1000000)
  const start = Number((range as string).replace(/\D/g, ''))
  const end = Math.min(start + chunkSize, videoSize - 1)
  const contentLength = end - start + 1
  const contentType = mime.lookup(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType,
  };
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers);
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
  videoStream.on('close', () => {
  });
  videoStream.on('error', (err) => {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Error streaming video');
  });
};

export const videoStatusMediaController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const result = await mediaService.getVideoStatus(id as string)
  return res.json({
    status:
      result?.status == 0 ? 'Pending' : result?.status == 1 ? 'Processing' : result?.status == 2 ? 'Success' : 'Failed',
    result: result !== null ? result : "Don't have this video"
  })
}
export const serveM3U8Controller = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR + '/', id, 'master.m3u8'), (err) => {
    if (err) {
      res.status(HTTP_STATUS.NOTFOUND).send('Not Found !!!')
    }
  })
}
export const serveSegmentController = (req: Request, res: Response, next: NextFunction) => {
  const { id, v, segment } = req.params
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR + '/', id, v, segment), (err) => {
    if (err) {
      res.status(HTTP_STATUS.NOTFOUND).send('Not Found !!!')
    }
  })
}