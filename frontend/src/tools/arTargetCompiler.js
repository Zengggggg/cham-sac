import { Compiler } from 'mind-ar/dist/mindar-image.prod.js'

const targetSources = [
  '/src/assets/ar-targets/card-18.png',
  '/src/assets/ar-targets/card-21.png',
  '/src/assets/ar-targets/card-22.png',
  '/src/assets/ar-targets/card-23.png',
  '/src/assets/ar-targets/card-24.png',
  '/src/assets/ar-targets/card-25.png',
  '/src/assets/ar-targets/card-27.png',
  '/src/assets/landmarks/fansipan.jpg',
]

const loadImage = (source) => new Promise((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error(`Không thể tải ${source}`))
  image.src = source
})

const statusElement = document.querySelector('#status')
const progressElement = document.querySelector('#progress')
const compileButton = document.querySelector('#compile')

compileButton.addEventListener('click', async () => {
  compileButton.disabled = true

  try {
    statusElement.textContent = `Đang tải ${targetSources.length} ảnh thẻ…`
    const images = await Promise.all(targetSources.map(loadImage))
    const compiler = new Compiler()

    await compiler.compileImageTargets(images, (progress) => {
      progressElement.value = progress
      statusElement.textContent = `Đang biên dịch: ${progress.toFixed(1)}%`
    })

    const buffer = await compiler.exportData()
    const blob = new Blob([buffer], { type: 'application/octet-stream' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'heritage-targets.mind'
    link.click()
    URL.revokeObjectURL(downloadUrl)

    progressElement.value = 100
    statusElement.textContent = `Hoàn tất: ${buffer.byteLength.toLocaleString('vi-VN')} byte`
  } catch (error) {
    console.error(error)
    statusElement.textContent = `Lỗi: ${error.message}`
    compileButton.disabled = false
  }
})
