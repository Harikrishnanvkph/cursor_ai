"use client"

import { useEffect, useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin'
import {
  $getRoot,
  $getSelection,
  $createParagraphNode,
  $createTextNode,
  EditorState,
  LexicalEditor,
  TextNode,
  $isTextNode
} from 'lexical'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Strikethrough,
  Undo,
  Redo,
  Palette,
  Highlighter,
  Image as ImageIcon,
  Type,
  PaintBucket,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $getSelection as $getSelectionAlias,
  $isRangeSelection,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
  LexicalCommand,
  COMMAND_PRIORITY_EDITOR
} from 'lexical'
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode
} from '@lexical/list'
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Custom command for inserting images
const INSERT_IMAGE_COMMAND: LexicalCommand<string> = createCommand('INSERT_IMAGE_COMMAND')

// Image Node
class ImageNode extends TextNode {
  __url: string

  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__url, node.__key)
  }

  constructor(url: string, key?: string) {
    super('', key)
    this.__url = url
  }

  createDOM(): HTMLElement {
    const img = document.createElement('img')
    img.src = this.__url
    img.style.maxWidth = '100%'
    img.style.height = 'auto'
    img.style.display = 'inline-block'
    img.style.margin = '8px 0'
    return img
  }

  updateDOM(): false {
    return false
  }

  static importJSON(serializedNode: any): ImageNode {
    return new ImageNode(serializedNode.url)
  }

  exportJSON() {
    return {
      type: 'image',
      url: this.__url,
      version: 1
    }
  }
}

// URL validation for auto-linking
const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/

const EMAIL_MATCHER =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text)
    if (match === null) return null
    const fullMatch = match[0]
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`
    }
  },
  (text: string) => {
    const match = EMAIL_MATCHER.exec(text)
    if (match === null) return null
    const fullMatch = match[0]
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: `mailto:${fullMatch}`
    }
  }
]

// Toolbar component
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [blockType, setBlockType] = useState('paragraph')
  const [linkUrl, setLinkUrl] = useState('')
  const [isLink, setIsLink] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [textColor, setTextColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffff00')
  const [fontSize, setFontSize] = useState('16')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat('bold'))
          setIsItalic(selection.hasFormat('italic'))
          setIsUnderline(selection.hasFormat('underline'))
          setIsStrikethrough(selection.hasFormat('strikethrough'))
          setIsCode(selection.hasFormat('code'))

          const node = selection.anchor.getNode()
          const parent = node.getParent()
          if ($isLinkNode(parent) || $isLinkNode(node)) {
            setIsLink(true)
          } else {
            setIsLink(false)
          }

          // Get block type
          const anchorNode = selection.anchor.getNode()
          const element = anchorNode.getKey() === 'root'
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow()

          const elementKey = element.getKey()
          const elementDOM = editor.getElementByKey(elementKey)

          if (elementDOM !== null) {
            if (element.getType() === 'heading') {
              const tag = (element as any).__tag
              setBlockType(tag)
            } else if ($isListNode(element)) {
              const parentList = element
              const listType = (parentList as any).__listType
              setBlockType(listType === 'number' ? 'ol' : 'ul')
            } else {
              const type = element.getType()
              setBlockType(type)
            }
          }
        }
      })
    })
  }, [editor])

  useEffect(() => {
    return editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload)
        return false
      },
      COMMAND_PRIORITY_LOW
    )
  }, [editor])

  useEffect(() => {
    return editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload)
        return false
      },
      COMMAND_PRIORITY_LOW
    )
  }, [editor])

  const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize))
        }
      })
    }
  }

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode())
        }
      })
    }
  }

  const insertLink = () => {
    if (!isLink && linkUrl) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl)
      setLinkUrl('')
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }

  const applyColor = (color: string) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if ($isTextNode(node)) {
            const currentStyle = node.getStyle() || ''
            const styleWithoutColor = currentStyle.replace(/color:\s*[^;]+;?/gi, '').trim()
            const newStyle = styleWithoutColor ? `${styleWithoutColor}; color: ${color}` : `color: ${color}`
            node.setStyle(newStyle)
          }
        })
      }
    })
    setShowColorPicker(false)
  }

  const applyBackgroundColor = (color: string) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if ($isTextNode(node)) {
            const currentStyle = node.getStyle() || ''
            const styleWithoutBg = currentStyle.replace(/background-color:\s*[^;]+;?/gi, '').trim()
            const newStyle = styleWithoutBg ? `${styleWithoutBg}; background-color: ${color}` : `background-color: ${color}`
            node.setStyle(newStyle)
          }
        })
      }
    })
  }

  const applyFontSize = (size: string) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if ($isTextNode(node)) {
            const currentStyle = node.getStyle() || ''
            const styleWithoutSize = currentStyle.replace(/font-size:\s*[^;]+;?/gi, '').trim()
            const newStyle = styleWithoutSize ? `${styleWithoutSize}; font-size: ${size}px` : `font-size: ${size}px`
            node.setStyle(newStyle)
          }
        })
      }
    })
  }

  const insertImage = () => {
    if (!imageUrl) return

    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const paragraph = $createParagraphNode()
        const img = document.createElement('img')
        img.src = imageUrl
        const textNode = $createTextNode('')
        textNode.setStyle(`background: url(${imageUrl}); background-size: contain; background-repeat: no-repeat; display: inline-block; width: 200px; height: 150px;`)

        // Insert as HTML instead
        const parser = new DOMParser()
        const dom = parser.parseFromString(`<p><img src="${imageUrl}" style="max-width: 100%; height: auto; display: block; margin: 8px 0;" /></p>`, 'text/html')
        const nodes = $generateNodesFromDOM(editor, dom)

        selection.insertNodes(nodes)
      }
    })
    setImageUrl('')
  }

  const formatAlignment = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment)
  }

  return (
    <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10">
      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={!canUndo}
        className="h-8 w-8 p-0"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={!canRedo}
        className="h-8 w-8 p-0"
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Font Size */}
      <Select value={fontSize} onValueChange={(value) => {
        setFontSize(value)
        applyFontSize(value)
      }}>
        <SelectTrigger className="h-8 w-20 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {['12', '14', '16', '18', '20', '24', '28', '32', '36', '48'].map(size => (
            <SelectItem key={size} value={size}>{size}px</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text formatting */}
      <Button
        variant={isBold ? "default" : "ghost"}
        size="sm"
        onClick={() => formatText('bold')}
        className="h-8 w-8 p-0"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant={isItalic ? "default" : "ghost"}
        size="sm"
        onClick={() => formatText('italic')}
        className="h-8 w-8 p-0"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant={isUnderline ? "default" : "ghost"}
        size="sm"
        onClick={() => formatText('underline')}
        className="h-8 w-8 p-0"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant={isStrikethrough ? "default" : "ghost"}
        size="sm"
        onClick={() => formatText('strikethrough')}
        className="h-8 w-8 p-0"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant={isCode ? "default" : "ghost"}
        size="sm"
        onClick={() => formatText('code')}
        className="h-8 w-8 p-0"
      >
        <Code className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Headings */}
      <Button
        variant={blockType === 'h1' ? "default" : "ghost"}
        size="sm"
        onClick={() => formatHeading('h1')}
        className="h-8 w-8 p-0"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant={blockType === 'h2' ? "default" : "ghost"}
        size="sm"
        onClick={() => formatHeading('h2')}
        className="h-8 w-8 p-0"
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant={blockType === 'h3' ? "default" : "ghost"}
        size="sm"
        onClick={() => formatHeading('h3')}
        className="h-8 w-8 p-0"
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <Button
        variant={blockType === 'quote' ? "default" : "ghost"}
        size="sm"
        onClick={formatQuote}
        className="h-8 w-8 p-0"
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists */}
      <Button
        variant={blockType === 'ul' ? "default" : "ghost"}
        size="sm"
        onClick={() => {
          if (blockType !== 'ul') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
          }
        }}
        className="h-8 w-8 p-0"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={blockType === 'ol' ? "default" : "ghost"}
        size="sm"
        onClick={() => {
          if (blockType !== 'ol') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
          } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
          }
        }}
        className="h-8 w-8 p-0"
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Alignment */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatAlignment('left')}
        className="h-8 w-8 p-0"
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatAlignment('center')}
        className="h-8 w-8 p-0"
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatAlignment('right')}
        className="h-8 w-8 p-0"
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatAlignment('justify')}
        className="h-8 w-8 p-0"
        title="Justify"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Link */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isLink ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            title="Insert Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <Label className="text-xs">Link URL</Label>
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  insertLink()
                }
              }}
              className="text-xs"
            />
            <Button onClick={insertLink} size="sm" className="w-full">
              {isLink ? 'Remove Link' : 'Insert Link'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Image */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <Label className="text-xs">Image URL</Label>
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  insertImage()
                }
              }}
              className="text-xs"
            />
            <Button onClick={insertImage} size="sm" className="w-full">
              Insert Image
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Color */}
      <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Text Color"
          >
            <Type className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <Label className="text-xs">Text Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-8 rounded border cursor-pointer"
              />
              <Input
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                placeholder="#000000"
                className="flex-1 text-xs"
              />
            </div>
            <Button onClick={() => applyColor(textColor)} size="sm" className="w-full">
              Apply Text Color
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Background/Highlight Color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <Label className="text-xs">Highlight Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-12 h-8 rounded border cursor-pointer"
              />
              <Input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                placeholder="#ffff00"
                className="flex-1 text-xs"
              />
            </div>
            <Button onClick={() => applyBackgroundColor(bgColor)} size="sm" className="w-full">
              Apply Highlight
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Plugin to load initial HTML content
function LoadHTMLPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext()
  const [isFirstRender, setIsFirstRender] = useState(true)

  useEffect(() => {
    if (!isFirstRender || !html) return

    editor.update(() => {
      const parser = new DOMParser()
      const dom = parser.parseFromString(html, 'text/html')
      const nodes = $generateNodesFromDOM(editor, dom)

      const root = $getRoot()
      root.clear()

      nodes.forEach(node => {
        root.append(node)
      })

      // After importing, traverse all nodes and apply inline styles
      root.getAllTextNodes().forEach(textNode => {
        // Get the corresponding DOM element to extract inline styles
        const key = textNode.getKey()
        const domNode = editor.getElementByKey(key)

        if (domNode) {
          const parentElement = domNode.parentElement
          if (parentElement) {
            const style = parentElement.getAttribute('style')
            if (style) {
              // Parse and apply inline styles
              const styleObj: Record<string, string> = {}
              style.split(';').forEach(rule => {
                const [prop, value] = rule.split(':').map(s => s.trim())
                if (prop && value) {
                  styleObj[prop] = value
                }
              })

              // Build style string for Lexical
              let lexicalStyle = ''
              if (styleObj['color']) lexicalStyle += `color: ${styleObj['color']}; `
              if (styleObj['font-style']) lexicalStyle += `font-style: ${styleObj['font-style']}; `
              if (styleObj['font-weight']) lexicalStyle += `font-weight: ${styleObj['font-weight']}; `
              if (styleObj['background-color']) lexicalStyle += `background-color: ${styleObj['background-color']}; `
              if (styleObj['text-decoration']) lexicalStyle += `text-decoration: ${styleObj['text-decoration']}; `
              if (styleObj['font-size']) lexicalStyle += `font-size: ${styleObj['font-size']}; `

              if (lexicalStyle) {
                textNode.setStyle(lexicalStyle.trim())
              }
            }
          }
        }
      })

      setIsFirstRender(false)
    })
  }, [editor, html, isFirstRender])

  return null
}

interface RichTextEditorProps {
  initialHtml: string
  onChange: (html: string) => void
  className?: string
}

export function RichTextEditor({ initialHtml, onChange, className = '' }: RichTextEditorProps) {
  const initialConfig = {
    namespace: 'TemplateRichTextEditor',
    theme: {
      paragraph: 'mb-2',
      heading: {
        h1: 'text-3xl font-bold mb-4',
        h2: 'text-2xl font-bold mb-3',
        h3: 'text-xl font-bold mb-2',
        h4: 'text-lg font-bold mb-2',
        h5: 'text-base font-bold mb-2',
        h6: 'text-sm font-bold mb-2',
      },
      list: {
        ul: 'list-disc list-inside mb-2',
        ol: 'list-decimal list-inside mb-2',
        listitem: 'ml-4',
      },
      link: 'text-blue-600 underline cursor-pointer hover:text-blue-800',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        code: 'bg-gray-100 px-1 py-0.5 rounded font-mono text-sm',
      },
      quote: 'border-l-4 border-gray-300 pl-4 italic my-2 text-gray-700',
      code: 'bg-gray-900 text-green-400 p-3 rounded font-mono text-sm block my-2 overflow-x-auto',
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
    ],
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
  }

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor, null)
      onChange(htmlString)
    })
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`border rounded-lg overflow-hidden bg-white ${className}`}>
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[200px] max-h-[400px] overflow-auto p-4 focus:outline-none prose prose-sm max-w-none" />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none text-sm">
                Start typing or use the toolbar above to format your text...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin matchers={MATCHERS} />
          <LoadHTMLPlugin html={initialHtml} />
        </div>
      </div>
    </LexicalComposer>
  )
}

