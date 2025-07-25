import type { Chart } from "chart.js"
import type { OverlayImage, OverlayText } from "./chart-store"

// Global drag state
const dragState = {
  isDragging: false,
  dragType: '' as 'image' | 'text' | '',
  dragId: '',
  dragOffsetX: 0,
  dragOffsetY: 0,
  isResizing: false,
  resizeHandle: '' as 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | '',
  startX: 0,
  startY: 0,
  startWidth: 0,
  startHeight: 0,
}

// Helper function to check if point is inside rectangle
function isPointInRect(x: number, y: number, rectX: number, rectY: number, width: number, height: number): boolean {
  return x >= rectX && x <= rectX + width && y >= rectY && y <= rectY + height
}

// Helper function to check if point is inside circle
function isPointInCircle(x: number, y: number, centerX: number, centerY: number, radius: number): boolean {
  const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
  return distance <= radius
}

// Helper function to draw resize handles
function drawResizeHandles(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
  const handleSize = 8
  const halfHandle = handleSize / 2
  const midX = x + width / 2
  const midY = y + height / 2
  
  ctx.save()
  ctx.fillStyle = '#007acc'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  
  // Draw all 8 handles: 4 corners + 4 edges
  const handles = [
    // Corner handles
    { x: x - halfHandle, y: y - halfHandle }, // NW
    { x: x + width - halfHandle, y: y - halfHandle }, // NE
    { x: x - halfHandle, y: y + height - halfHandle }, // SW
    { x: x + width - halfHandle, y: y + height - halfHandle }, // SE
    
    // Edge handles
    { x: midX - halfHandle, y: y - halfHandle }, // N (top)
    { x: x + width - halfHandle, y: midY - halfHandle }, // E (right)
    { x: midX - halfHandle, y: y + height - halfHandle }, // S (bottom)
    { x: x - halfHandle, y: midY - halfHandle }, // W (left)
  ]
  
  handles.forEach(handle => {
    ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
    ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
  })
  
  ctx.restore()
}

// Helper function to draw dashed border
function drawDashedBorder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
  ctx.save()
  ctx.strokeStyle = '#007acc'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.strokeRect(x, y, width, height)
  ctx.restore()
}

// Helper function to check which resize handle is clicked
function getResizeHandle(mouseX: number, mouseY: number, imageX: number, imageY: number, imageWidth: number, imageHeight: number): 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | null {
  const handleSize = 8
  const tolerance = 4
  const midX = imageX + imageWidth / 2
  const midY = imageY + imageHeight / 2
  
  const handles = [
    // Corner handles
    { type: 'nw' as const, x: imageX - handleSize/2, y: imageY - handleSize/2 },
    { type: 'ne' as const, x: imageX + imageWidth - handleSize/2, y: imageY - handleSize/2 },
    { type: 'sw' as const, x: imageX - handleSize/2, y: imageY + imageHeight - handleSize/2 },
    { type: 'se' as const, x: imageX + imageWidth - handleSize/2, y: imageY + imageHeight - handleSize/2 },
    
    // Edge handles
    { type: 'n' as const, x: midX - handleSize/2, y: imageY - handleSize/2 },
    { type: 'e' as const, x: imageX + imageWidth - handleSize/2, y: midY - handleSize/2 },
    { type: 's' as const, x: midX - handleSize/2, y: imageY + imageHeight - handleSize/2 },
    { type: 'w' as const, x: imageX - handleSize/2, y: midY - handleSize/2 },
  ]
  
  for (const handle of handles) {
    if (isPointInRect(mouseX, mouseY, handle.x - tolerance, handle.y - tolerance, handleSize + tolerance*2, handleSize + tolerance*2)) {
      return handle.type
    }
  }
  
  return null
}

// Helper function to draw rounded rectangle
function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

// Helper function to clip image based on shape
function clipImageToShape(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, shape: string): void {
  ctx.save()
  
  if (shape === 'circle') {
    const centerX = x + width / 2
    const centerY = y + height / 2
    const radius = Math.min(width, height) / 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.clip()
  } else if (shape === 'rounded') {
    const radius = Math.min(width, height) * 0.1
    drawRoundedRect(ctx, x, y, width, height, radius)
    ctx.clip()
  } else {
    // Rectangle - default clipping
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.clip()
  }
}

// Image cache to store preloaded images
const imageCache = new Map<string, HTMLImageElement>()

// Helper function to calculate smart image dimensions (20% of canvas height with aspect ratio)
function calculateSmartDimensions(naturalWidth: number, naturalHeight: number, canvasHeight: number): { width: number, height: number } {
  const targetHeight = Math.floor(canvasHeight * 0.2) // 20% of canvas height
  const aspectRatio = naturalWidth / naturalHeight
  
  let smartWidth = Math.floor(targetHeight * aspectRatio)
  let smartHeight = targetHeight
  
  // Ensure minimum size
  const minSize = 50
  if (smartWidth < minSize || smartHeight < minSize) {
    if (aspectRatio > 1) {
      // Wider than tall
      smartWidth = minSize
      smartHeight = Math.floor(minSize / aspectRatio)
    } else {
      // Taller than wide
      smartHeight = minSize
      smartWidth = Math.floor(minSize * aspectRatio)
    }
  }
  
  return { width: smartWidth, height: smartHeight }
}

// Function to render overlay image
function renderOverlayImage(ctx: CanvasRenderingContext2D, image: OverlayImage, chartArea: any, chart?: any): void {
  console.log('renderOverlayImage called:', image)
  
  if (!image.visible) {
    console.log('Image not visible, skipping')
    return
  }

  // Draw a test rectangle first to verify positioning
  ctx.save()
  ctx.fillStyle = 'red'
  ctx.fillRect(chartArea.left + image.x, chartArea.top + image.y, image.width, image.height)
  ctx.restore()
  console.log('Drew test rectangle at:', { x: chartArea.left + image.x, y: chartArea.top + image.y, w: image.width, h: image.height })

  // Check if image is already cached
  let img = imageCache.get(image.url)
  
  if (img && img.complete) {
    console.log('Using cached image')
    // Image is loaded, draw it immediately
    drawImageOnCanvas(ctx, img, image, chartArea)
  } else {
    console.log('Loading new image:', image.url)
    // Load and cache the image
    img = new Image()
    img.crossOrigin = "anonymous"
    
    img.onload = () => {
      console.log('Image loaded successfully:', image.url)
      console.log('Natural dimensions:', img!.naturalWidth, 'x', img!.naturalHeight)
      
      // Cache the loaded image
      imageCache.set(image.url, img!)
      
      // Update store with natural dimensions and size if needed
      const updateData: any = {}
      if (!image.naturalWidth || !image.naturalHeight) {
        updateData.naturalWidth = img!.naturalWidth
        updateData.naturalHeight = img!.naturalHeight
      }
      
      // Calculate smart dimensions based on canvas size
      const canvasHeight = chart.canvas.height || 400 // fallback height
      const smartDimensions = calculateSmartDimensions(img!.naturalWidth, img!.naturalHeight, canvasHeight)
      
      // If using natural size, use smart dimensions instead of full natural size
      if (image.useNaturalSize) {
        updateData.width = smartDimensions.width
        updateData.height = smartDimensions.height
      }
      
      // Dispatch update event if needed
      if (Object.keys(updateData).length > 0) {
        const updateEvent = new CustomEvent('overlayImageDimensionsUpdate', { 
          detail: { imageId: image.id, updateData }
        })
        chart.canvas.dispatchEvent(updateEvent)
      }
      
      // Draw the image
      drawImageOnCanvas(ctx, img!, image, chartArea)
      
      // Trigger chart redraw to show the image
      if (chart && chart.update) {
        chart.update('none')
      }
    }
    
    img.onerror = () => {
      console.warn('Failed to load overlay image:', image.url)
    }
    
    img.src = image.url
  }
}

// Helper function to draw image on canvas
function drawImageOnCanvas(ctx: CanvasRenderingContext2D, img: HTMLImageElement, image: OverlayImage, chartArea: any): void {
  ctx.save()
  
  // Determine dimensions to use
  let renderWidth = image.width
  let renderHeight = image.height
  
  // Use natural size if specified and available
  if (image.useNaturalSize && img.naturalWidth && img.naturalHeight) {
    renderWidth = img.naturalWidth
    renderHeight = img.naturalHeight
  }
  
  // Apply clipping based on shape
  clipImageToShape(ctx, chartArea.left + image.x, chartArea.top + image.y, renderWidth, renderHeight, image.shape)
  
  // Draw the image
  ctx.drawImage(img, chartArea.left + image.x, chartArea.top + image.y, renderWidth, renderHeight)
  ctx.restore()
  
  // Draw border if specified
  if (image.borderWidth > 0) {
    ctx.save()
    ctx.strokeStyle = image.borderColor
    ctx.lineWidth = image.borderWidth
    
    if (image.shape === 'circle') {
      const centerX = chartArea.left + image.x + renderWidth / 2
      const centerY = chartArea.top + image.y + renderHeight / 2
      const radius = Math.min(renderWidth, renderHeight) / 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.stroke()
    } else if (image.shape === 'rounded') {
      const radius = Math.min(image.width, image.height) * 0.1
      drawRoundedRect(ctx, chartArea.left + image.x, chartArea.top + image.y, image.width, image.height, radius)
      ctx.stroke()
    } else {
      ctx.strokeRect(chartArea.left + image.x, chartArea.top + image.y, image.width, image.height)
    }
    
    ctx.restore()
  }
}

// Function to render overlay text
function renderOverlayText(ctx: CanvasRenderingContext2D, text: OverlayText, chartArea: any): void {
  if (!text.visible) return

  ctx.save()
  
  // Set font properties
  ctx.font = `${text.fontSize}px ${text.fontFamily}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  
  const x = chartArea.left + text.x
  const y = chartArea.top + text.y
  
  // Apply rotation if specified
  if (text.rotation !== 0) {
    ctx.translate(x, y)
    ctx.rotate((text.rotation * Math.PI) / 180)
    ctx.translate(-x, -y)
  }
  
  // Measure text for background and border calculations
  const textMetrics = ctx.measureText(text.text)
  const textWidth = textMetrics.width
  const textHeight = text.fontSize // Approximate height
  
  // Get padding values (with fallbacks for existing text overlays)
  const paddingX = text.paddingX || 8
  const paddingY = text.paddingY || 4
  
  // Calculate background/border rectangle with padding
  const bgX = x - paddingX
  const bgY = y - paddingY
  const bgWidth = textWidth + (paddingX * 2)
  const bgHeight = textHeight + (paddingY * 2)
  
  // Draw background if not transparent
  if (!text.backgroundTransparent && text.backgroundColor) {
    ctx.fillStyle = text.backgroundColor
    ctx.fillRect(bgX, bgY, bgWidth, bgHeight)
  }
  
  // Draw border if specified
  if (text.borderWidth > 0) {
    ctx.strokeStyle = text.borderColor
    ctx.lineWidth = text.borderWidth
    ctx.strokeRect(bgX, bgY, bgWidth, bgHeight)
  }
  
  // Draw text
  ctx.fillStyle = text.color
  ctx.fillText(text.text, x, y)
  
  ctx.restore()
}

// The overlay plugin
export const overlayPlugin = {
  id: 'overlayPlugin',
  
  beforeInit: () => {
    console.log('🔴🔴🔴 OVERLAY PLUGIN REGISTERED AND INITIALIZED! 🔴🔴🔴')
  },
  
  afterDraw: (chart: Chart) => {
    console.log('🔴 OVERLAY PLUGIN afterDraw called!')
    
    const ctx = chart.ctx
    const chartArea = chart.chartArea
    
    // Get overlay data from plugin options (Chart.js filters out non-standard root options)
    const pluginConfig = (chart.options as any)?.plugins?.overlayPlugin || {}
    const overlayImages = pluginConfig.overlayImages || []
    const overlayTexts = pluginConfig.overlayTexts || []
    
    console.log('🔴 Plugin config found:', pluginConfig)
    console.log('🔴 Overlay images:', overlayImages.length, overlayImages)
    console.log('🔴 Overlay texts:', overlayTexts.length, overlayTexts)
    
    // Handle overlay images
    if (overlayImages.length > 0) {
      overlayImages.forEach((image: any, index: number) => {
        if (image.visible) {
          const x = chartArea.left + image.x
          const y = chartArea.top + image.y
          
          // Check if image is already cached
          let img = imageCache.get(image.url)
          
          if (img && img.complete) {
            // Determine dimensions to use
            let w = image.width
            let h = image.height
            
            // Use natural size if specified and available
            if (image.useNaturalSize && img.naturalWidth && img.naturalHeight) {
              w = img.naturalWidth
              h = img.naturalHeight
            }
            
            // Image is loaded, draw it
            ctx.save()
            clipImageToShape(ctx, x, y, w, h, image.shape)
            ctx.drawImage(img, x, y, w, h)
            ctx.restore()
            
            // Draw border if specified
            if (image.borderWidth > 0) {
              ctx.save()
              ctx.strokeStyle = image.borderColor
              ctx.lineWidth = image.borderWidth
              ctx.strokeRect(x, y, w, h)
              ctx.restore()
            }
          } else {
            // Use fallback dimensions for placeholder
            const w = image.width
            const h = image.height
            
            // Image not loaded yet, show placeholder
            ctx.save()
            ctx.fillStyle = image.borderColor || 'gray'
            ctx.strokeStyle = image.borderColor || 'blue'
            ctx.lineWidth = Math.max(2, image.borderWidth)
            
            // Draw placeholder rectangle
            ctx.fillRect(x, y, w, h)
            ctx.strokeRect(x, y, w, h)
            
            // Draw loading text
            ctx.fillStyle = 'white'
            ctx.font = '14px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('Loading...', x + w/2, y + h/2)
            ctx.textAlign = 'left'
            
            ctx.restore()
            
            // Try to load the image if not already loading
            if (!img) {
              img = new Image()
              img.crossOrigin = "anonymous"
              
              img.onload = () => {
                console.log('🖼️ Image loaded successfully:', image.url.substring(0, 50) + '...')
                console.log('📏 Natural dimensions:', img!.naturalWidth, 'x', img!.naturalHeight)
                
                imageCache.set(image.url, img!)
                
                // Update store with natural dimensions and size if needed
                const updateData: any = {}
                if (!image.naturalWidth || !image.naturalHeight) {
                  updateData.naturalWidth = img!.naturalWidth
                  updateData.naturalHeight = img!.naturalHeight
                }
                
                // Calculate smart dimensions based on canvas size
                const canvasHeight = chart.canvas.height || 400 // fallback height
                const smartDimensions = calculateSmartDimensions(img!.naturalWidth, img!.naturalHeight, canvasHeight)
                
                // If using natural size, use smart dimensions instead of full natural size
                if (image.useNaturalSize) {
                  updateData.width = smartDimensions.width
                  updateData.height = smartDimensions.height
                }
                
                // Dispatch update event if needed
                if (Object.keys(updateData).length > 0) {
                  const updateEvent = new CustomEvent('overlayImageDimensionsUpdate', { 
                    detail: { imageId: image.id, updateData }
                  })
                  chart.canvas.dispatchEvent(updateEvent)
                }
                
                // Multiple approaches to trigger chart redraw
                console.log('🔄 Triggering chart update...')
                
                // Approach 1: Direct chart update
                if (chart && typeof chart.update === 'function') {
                  requestAnimationFrame(() => {
                    chart.update('none')
                    console.log('✅ Direct chart update completed')
                  })
                } else {
                  console.warn('⚠️ Direct chart update not available')
                }
                
                // Approach 2: Dispatch custom event to component level
                if (chart && chart.canvas) {
                  const event = new CustomEvent('overlayImageLoaded', {
                    detail: { imageUrl: image.url }
                  })
                  chart.canvas.dispatchEvent(event)
                  console.log('📡 Custom event dispatched')
                }
                
                // Approach 3: Force redraw by calling the plugin again
                setTimeout(() => {
                  if (chart && chart.draw) {
                    chart.draw()
                    console.log('🎨 Forced redraw completed')
                  }
                }, 10)
              }
              
              img.onerror = () => {
                console.error('❌ Failed to load overlay image:', image.url.substring(0, 50) + '...')
              }
              
              img.src = image.url
              console.log('🔄 Started loading image:', image.url.substring(0, 50) + '...')
            }
          }
        }
      })
    }
    
    // Draw overlay texts
    if (overlayTexts.length > 0) {
      overlayTexts.forEach((text: any) => {
        if (text.visible) {
          renderOverlayText(ctx, text, chartArea)
        }
      })
    }
    
    // Draw selection handles for selected image
    const selectedImageId = (chart.options as any)?.plugins?.overlayPlugin?.selectedImageId
    if (selectedImageId) {
      const selectedImage = overlayImages.find((img: any) => img.id === selectedImageId)
      if (selectedImage && selectedImage.visible) {
        const x = chartArea.left + selectedImage.x
        const y = chartArea.top + selectedImage.y
        
        // Determine dimensions to use
        let w = selectedImage.width
        let h = selectedImage.height
        
        // Use natural size if specified and available
        if (selectedImage.useNaturalSize && selectedImage.naturalWidth && selectedImage.naturalHeight) {
          w = selectedImage.naturalWidth
          h = selectedImage.naturalHeight
        }
        
        // Draw dashed border
        drawDashedBorder(ctx, x, y, w, h)
        
        // Draw resize handles
        drawResizeHandles(ctx, x, y, w, h)
      }
    }
  },
  
  afterInit: (chart: Chart) => {
    const canvas = chart.canvas
    
    // Mouse event handlers
    const handleMouseDown = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const chartArea = chart.chartArea
      
      // Get overlay data
      const overlayImages = (chart.options as any)?.overlayImages || []
      const overlayTexts = (chart.options as any)?.overlayTexts || []
      
      // Check if clicking on any overlay (check in reverse zIndex order for top-most)
      const allOverlays = [
        ...overlayImages.map((img: OverlayImage) => ({ type: 'image', data: img })),
        ...overlayTexts.map((txt: OverlayText) => ({ type: 'text', data: txt }))
      ].sort((a, b) => b.data.zIndex - a.data.zIndex) // Reverse order for top-most first
      
      for (const overlay of allOverlays) {
        if (overlay.type === 'image') {
          const img = overlay.data as OverlayImage
          if (!img.visible) continue
          
          const imgX = chartArea.left + img.x
          const imgY = chartArea.top + img.y
          
          // Determine dimensions for hit detection
          let hitWidth = img.width
          let hitHeight = img.height
          
          // Use natural size if specified and available
          if (img.useNaturalSize && img.naturalWidth && img.naturalHeight) {
            hitWidth = img.naturalWidth
            hitHeight = img.naturalHeight
          }
          
          // Check if clicking on resize handle first (only for selected image)
          const overlayData = (chart.options as any)?.plugins?.overlayPlugin || {}
          const selectedImageId = overlayData.selectedImageId
          
          if (selectedImageId === img.id) {
            const resizeHandle = getResizeHandle(x, y, imgX, imgY, hitWidth, hitHeight)
            if (resizeHandle) {
              // Start resize operation
              dragState.isResizing = true
              dragState.resizeHandle = resizeHandle
              dragState.dragId = img.id
              dragState.startX = imgX
              dragState.startY = imgY
              dragState.startWidth = hitWidth
              dragState.startHeight = hitHeight
              
              // Set appropriate cursor based on handle type
              switch (resizeHandle) {
                case 'nw':
                case 'se':
                  canvas.style.cursor = 'nw-resize'
                  break
                case 'ne':
                case 'sw':
                  canvas.style.cursor = 'ne-resize'
                  break
                case 'n':
                case 's':
                  canvas.style.cursor = 'ns-resize'
                  break
                case 'e':
                case 'w':
                  canvas.style.cursor = 'ew-resize'
                  break
              }
              event.preventDefault()
              break
            }
          }
          
          let isInside = false
          if (img.shape === 'circle') {
            const centerX = imgX + hitWidth / 2
            const centerY = imgY + hitHeight / 2
            const radius = Math.min(hitWidth, hitHeight) / 2
            isInside = isPointInCircle(x, y, centerX, centerY, radius)
          } else {
            isInside = isPointInRect(x, y, imgX, imgY, hitWidth, hitHeight)
          }
          
          if (isInside) {
            // Select the image
            const selectEvent = new CustomEvent('overlayImageSelected', {
              detail: { imageId: img.id }
            })
            canvas.dispatchEvent(selectEvent)
            
            // Start drag operation
            dragState.isDragging = true
            dragState.dragType = 'image'
            dragState.dragId = img.id
            dragState.dragOffsetX = x - imgX
            dragState.dragOffsetY = y - imgY
            canvas.style.cursor = 'grabbing'
            event.preventDefault()
            break
          }
        } else {
          const txt = overlay.data as OverlayText
          if (!txt.visible) continue
          
          // Approximate text dimensions with padding
          const ctx = chart.ctx
          ctx.font = `${txt.fontSize}px ${txt.fontFamily}`
          const textMetrics = ctx.measureText(txt.text)
          const textWidth = textMetrics.width
          const textHeight = txt.fontSize
          
          // Account for padding in hit detection
          const paddingX = txt.paddingX || 8
          const paddingY = txt.paddingY || 4
          
          const txtX = chartArea.left + txt.x - paddingX
          const txtY = chartArea.top + txt.y - paddingY
          const hitWidth = textWidth + (paddingX * 2)
          const hitHeight = textHeight + (paddingY * 2)
          
          if (isPointInRect(x, y, txtX, txtY, hitWidth, hitHeight)) {
            dragState.isDragging = true
            dragState.dragType = 'text'
            dragState.dragId = txt.id
            dragState.dragOffsetX = x - txtX
            dragState.dragOffsetY = y - txtY
            canvas.style.cursor = 'grabbing'
            event.preventDefault()
            break
          }
        }
      }
    }
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const chartArea = chart.chartArea
      
      if (dragState.isResizing) {
        // Handle resize operation
        const deltaX = x - (dragState.startX + dragState.dragOffsetX)
        const deltaY = y - (dragState.startY + dragState.dragOffsetY)
        
        let newWidth = dragState.startWidth
        let newHeight = dragState.startHeight
        let newX = dragState.startX - chartArea.left
        let newY = dragState.startY - chartArea.top
        
        switch (dragState.resizeHandle) {
          // Corner handles
          case 'se': // Southeast - resize from bottom-right
            newWidth = Math.max(20, dragState.startWidth + (x - dragState.startX - dragState.startWidth))
            newHeight = Math.max(20, dragState.startHeight + (y - dragState.startY - dragState.startHeight))
            break
          case 'sw': // Southwest - resize from bottom-left
            newWidth = Math.max(20, dragState.startWidth - (x - dragState.startX))
            newHeight = Math.max(20, dragState.startHeight + (y - dragState.startY - dragState.startHeight))
            newX = dragState.startX - chartArea.left + (dragState.startWidth - newWidth)
            break
          case 'ne': // Northeast - resize from top-right
            newWidth = Math.max(20, dragState.startWidth + (x - dragState.startX - dragState.startWidth))
            newHeight = Math.max(20, dragState.startHeight - (y - dragState.startY))
            newY = dragState.startY - chartArea.top + (dragState.startHeight - newHeight)
            break
          case 'nw': // Northwest - resize from top-left
            newWidth = Math.max(20, dragState.startWidth - (x - dragState.startX))
            newHeight = Math.max(20, dragState.startHeight - (y - dragState.startY))
            newX = dragState.startX - chartArea.left + (dragState.startWidth - newWidth)
            newY = dragState.startY - chartArea.top + (dragState.startHeight - newHeight)
            break
            
          // Edge handles
          case 'n': // North - resize from top
            newHeight = Math.max(20, dragState.startHeight - (y - dragState.startY))
            newY = dragState.startY - chartArea.top + (dragState.startHeight - newHeight)
            break
          case 'e': // East - resize from right
            newWidth = Math.max(20, dragState.startWidth + (x - dragState.startX - dragState.startWidth))
            break
          case 's': // South - resize from bottom
            newHeight = Math.max(20, dragState.startHeight + (y - dragState.startY - dragState.startHeight))
            break
          case 'w': // West - resize from left
            newWidth = Math.max(20, dragState.startWidth - (x - dragState.startX))
            newX = dragState.startX - chartArea.left + (dragState.startWidth - newWidth)
            break
        }
        
        // Dispatch resize event
        const resizeEvent = new CustomEvent('overlayImageResize', {
          detail: {
            id: dragState.dragId,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
            useNaturalSize: false // Turn off natural size when manually resizing
          }
        })
        canvas.dispatchEvent(resizeEvent)
        
        event.preventDefault()
      } else if (dragState.isDragging) {
        // Calculate new position relative to chart area
        const newX = x - dragState.dragOffsetX - chartArea.left
        const newY = y - dragState.dragOffsetY - chartArea.top
        
        // Dispatch custom event to update position
        const updateEvent = new CustomEvent('overlayPositionUpdate', {
          detail: {
            type: dragState.dragType,
            id: dragState.dragId,
            x: newX,
            y: newY
          }
        })
        canvas.dispatchEvent(updateEvent)
        
        event.preventDefault()
      } else {
        // Check if hovering over any overlay for cursor change
        let isOverOverlay = false
        let hoverCursor = 'default'
        const overlayData = (chart.options as any)?.plugins?.overlayPlugin || {}
        const overlayImages = overlayData.overlayImages || []
        const overlayTexts = overlayData.overlayTexts || []
        const selectedImageId = overlayData.selectedImageId
        
        // Check images
        for (const img of overlayImages) {
          if (!img.visible) continue
          
          const imgX = chartArea.left + img.x
          const imgY = chartArea.top + img.y
          
          // Determine dimensions for hover detection
          let hoverWidth = img.width
          let hoverHeight = img.height
          
          // Use natural size if specified and available
          if (img.useNaturalSize && img.naturalWidth && img.naturalHeight) {
            hoverWidth = img.naturalWidth
            hoverHeight = img.naturalHeight
          }
          
          // If this is the selected image, check for resize handle hover first
          if (selectedImageId === img.id) {
            const resizeHandle = getResizeHandle(x, y, imgX, imgY, hoverWidth, hoverHeight)
            if (resizeHandle) {
              isOverOverlay = true
              // Set cursor based on handle type
              switch (resizeHandle) {
                case 'nw':
                case 'se':
                  hoverCursor = 'nw-resize'
                  break
                case 'ne':
                case 'sw':
                  hoverCursor = 'ne-resize'
                  break
                case 'n':
                case 's':
                  hoverCursor = 'ns-resize'
                  break
                case 'e':
                case 'w':
                  hoverCursor = 'ew-resize'
                  break
              }
              break
            }
          }
          
          let isInside = false
          if (img.shape === 'circle') {
            const centerX = imgX + hoverWidth / 2
            const centerY = imgY + hoverHeight / 2
            const radius = Math.min(hoverWidth, hoverHeight) / 2
            isInside = isPointInCircle(x, y, centerX, centerY, radius)
          } else {
            isInside = isPointInRect(x, y, imgX, imgY, hoverWidth, hoverHeight)
          }
          
          if (isInside) {
            isOverOverlay = true
            if (hoverCursor === 'default') {
              hoverCursor = 'grab'
            }
            break
          }
        }
        
        // Check texts if not already over an image
        if (!isOverOverlay) {
          const ctx = chart.ctx
          for (const txt of overlayTexts) {
            if (!txt.visible) continue
            
            ctx.font = `${txt.fontSize}px ${txt.fontFamily}`
            const textMetrics = ctx.measureText(txt.text)
            const textWidth = textMetrics.width
            const textHeight = txt.fontSize
            
            // Account for padding in hover detection
            const paddingX = txt.paddingX || 8
            const paddingY = txt.paddingY || 4
            
            const txtX = chartArea.left + txt.x - paddingX
            const txtY = chartArea.top + txt.y - paddingY
            const hitWidth = textWidth + (paddingX * 2)
            const hitHeight = textHeight + (paddingY * 2)
            
            if (isPointInRect(x, y, txtX, txtY, hitWidth, hitHeight)) {
              isOverOverlay = true
              break
            }
          }
        }
        
        canvas.style.cursor = hoverCursor
      }
    }
    
    const handleMouseUp = () => {
      if (dragState.isDragging || dragState.isResizing) {
        dragState.isDragging = false
        dragState.isResizing = false
        dragState.resizeHandle = ''
        dragState.dragType = ''
        dragState.dragId = ''
        canvas.style.cursor = 'default'
      }
    }
    
    // Touch event handlers for mobile support
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const touch = event.touches[0]
      const rect = canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      
      // Convert to mouse event format and use same logic
      const mouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => event.preventDefault()
      } as MouseEvent
      
      handleMouseDown(mouseEvent)
    }
    
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const touch = event.touches[0]
      
      const mouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => event.preventDefault()
      } as MouseEvent
      
      handleMouseMove(mouseEvent)
    }
    
    const handleTouchEnd = (event: TouchEvent) => {
      handleMouseUp()
      event.preventDefault()
    }
    
    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    // Store references for cleanup
    ;(chart as any)._overlayPluginListeners = {
      mousedown: handleMouseDown,
      mousemove: handleMouseMove,
      mouseup: handleMouseUp,
      mouseleave: handleMouseUp,
      touchstart: handleTouchStart,
      touchmove: handleTouchMove,
      touchend: handleTouchEnd
    }
  },
  
  beforeDestroy: (chart: Chart) => {
    // Clean up event listeners
    const listeners = (chart as any)._overlayPluginListeners
    if (listeners) {
      const canvas = chart.canvas
      Object.entries(listeners).forEach(([event, handler]) => {
        canvas.removeEventListener(event, handler as EventListener)
      })
      delete (chart as any)._overlayPluginListeners
    }
  }
} 