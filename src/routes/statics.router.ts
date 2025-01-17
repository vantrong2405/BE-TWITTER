import { Router } from 'express'
import { serveImageController, serveM3U8Controller, serveSegmentController, serveVideoStreamController } from '~/controllers/medias.controllers'
const staticRoutes = Router()
staticRoutes.get('/image/:name', serveImageController)
staticRoutes.get('/video-stream/:name', serveVideoStreamController)
staticRoutes.get('/video-hls/:id/master.m3u8', serveM3U8Controller)
staticRoutes.get('/video-hls/:id/:v/:segment', serveSegmentController)
export default staticRoutes

