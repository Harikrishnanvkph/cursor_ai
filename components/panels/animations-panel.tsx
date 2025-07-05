"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useChartStore } from "@/lib/chart-store"

export function AnimationsPanel() {
  const { chartConfig, updateChartConfig } = useChartStore()

  const handleConfigUpdate = (path: string, value: any) => {
    const keys = path.split(".")
    const newConfig = { ...chartConfig }
    let current = newConfig

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    updateChartConfig(newConfig)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Animation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={chartConfig.animation !== false}
              onCheckedChange={(checked) => handleConfigUpdate("animation", checked ? {} : false)}
            />
            <Label>Enable Animations</Label>
          </div>

          {chartConfig.animation !== false && (
            <>
              <div>
                <Label>Duration (ms)</Label>
                <Slider
                  value={[chartConfig.animation?.duration || 1000]}
                  onValueChange={([value]) => handleConfigUpdate("animation.duration", value)}
                  max={3000}
                  min={100}
                  step={100}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.animation?.duration || 1000}ms</div>
              </div>

              <div>
                <Label>Easing</Label>
                <Select
                  value={chartConfig.animation?.easing || "easeOutQuart"}
                  onValueChange={(value) => handleConfigUpdate("animation.easing", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="easeInQuad">Ease In Quad</SelectItem>
                    <SelectItem value="easeOutQuad">Ease Out Quad</SelectItem>
                    <SelectItem value="easeInOutQuad">Ease In Out Quad</SelectItem>
                    <SelectItem value="easeInCubic">Ease In Cubic</SelectItem>
                    <SelectItem value="easeOutCubic">Ease Out Cubic</SelectItem>
                    <SelectItem value="easeInOutCubic">Ease In Out Cubic</SelectItem>
                    <SelectItem value="easeInQuart">Ease In Quart</SelectItem>
                    <SelectItem value="easeOutQuart">Ease Out Quart</SelectItem>
                    <SelectItem value="easeInOutQuart">Ease In Out Quart</SelectItem>
                    <SelectItem value="easeInQuint">Ease In Quint</SelectItem>
                    <SelectItem value="easeOutQuint">Ease Out Quint</SelectItem>
                    <SelectItem value="easeInOutQuint">Ease In Out Quint</SelectItem>
                    <SelectItem value="easeInSine">Ease In Sine</SelectItem>
                    <SelectItem value="easeOutSine">Ease Out Sine</SelectItem>
                    <SelectItem value="easeInOutSine">Ease In Out Sine</SelectItem>
                    <SelectItem value="easeInExpo">Ease In Expo</SelectItem>
                    <SelectItem value="easeOutExpo">Ease Out Expo</SelectItem>
                    <SelectItem value="easeInOutExpo">Ease In Out Expo</SelectItem>
                    <SelectItem value="easeInCirc">Ease In Circ</SelectItem>
                    <SelectItem value="easeOutCirc">Ease Out Circ</SelectItem>
                    <SelectItem value="easeInOutCirc">Ease In Out Circ</SelectItem>
                    <SelectItem value="easeInElastic">Ease In Elastic</SelectItem>
                    <SelectItem value="easeOutElastic">Ease Out Elastic</SelectItem>
                    <SelectItem value="easeInOutElastic">Ease In Out Elastic</SelectItem>
                    <SelectItem value="easeInBack">Ease In Back</SelectItem>
                    <SelectItem value="easeOutBack">Ease Out Back</SelectItem>
                    <SelectItem value="easeInOutBack">Ease In Out Back</SelectItem>
                    <SelectItem value="easeInBounce">Ease In Bounce</SelectItem>
                    <SelectItem value="easeOutBounce">Ease Out Bounce</SelectItem>
                    <SelectItem value="easeInOutBounce">Ease In Out Bounce</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Delay (ms)</Label>
                <Slider
                  value={[chartConfig.animation?.delay || 0]}
                  onValueChange={([value]) => handleConfigUpdate("animation.delay", value)}
                  max={2000}
                  min={0}
                  step={100}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.animation?.delay || 0}ms</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Hover Animations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Hover Animation Duration (ms)</Label>
            <Slider
              value={[chartConfig.hover?.animationDuration || 400]}
              onValueChange={([value]) => handleConfigUpdate("hover.animationDuration", value)}
              max={1000}
              min={0}
              step={50}
              className="mt-2"
            />
            <div className="text-xs text-gray-500 mt-1">{chartConfig.hover?.animationDuration || 400}ms</div>
          </div>

          <div>
            <Label>Hover Mode</Label>
            <Select
              value={chartConfig.hover?.mode || "nearest"}
              onValueChange={(value) => handleConfigUpdate("hover.mode", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearest">Nearest</SelectItem>
                <SelectItem value="point">Point</SelectItem>
                <SelectItem value="index">Index</SelectItem>
                <SelectItem value="dataset">Dataset</SelectItem>
                <SelectItem value="x">X-Axis</SelectItem>
                <SelectItem value="y">Y-Axis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Switch
              checked={chartConfig.hoverFadeEffect !== false}
              onCheckedChange={(checked) => handleConfigUpdate("hoverFadeEffect", checked)}
            />
            <Label>Enable Hover Fade Effect</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Responsive Animations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Resize Animation Duration (ms)</Label>
            <Slider
              value={[chartConfig.responsive?.animationDuration || 0]}
              onValueChange={([value]) => handleConfigUpdate("responsive.animationDuration", value)}
              max={1000}
              min={0}
              step={50}
              className="mt-2"
            />
            <div className="text-xs text-gray-500 mt-1">{chartConfig.responsive?.animationDuration || 0}ms</div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={chartConfig.maintainAspectRatio !== false}
              onCheckedChange={(checked) => handleConfigUpdate("maintainAspectRatio", checked)}
            />
            <Label>Maintain Aspect Ratio</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
