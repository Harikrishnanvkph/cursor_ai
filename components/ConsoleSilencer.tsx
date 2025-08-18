"use client"
import { useEffect } from "react"

export default function ConsoleSilencer() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      // Preserve errors and warnings, silence log/info/debug
      // eslint-disable-next-line no-console
      console.log = () => {}
      // eslint-disable-next-line no-console
      console.info = () => {}
      // eslint-disable-next-line no-console
      console.debug = () => {}
    }
  }, [])
  return null
}
