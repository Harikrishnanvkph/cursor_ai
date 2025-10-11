"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { migrationService, MigrationResult } from '@/lib/migration-service'
import { useAuth } from '@/components/auth/AuthProvider'
import { toast } from 'sonner'

interface MigrationDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function MigrationDialog({ isOpen, onClose }: MigrationDialogProps) {
  const { user } = useAuth()
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [preview, setPreview] = useState<{
    conversations: number
    chartSettings: boolean
    preferences: boolean
    totalSize: number
  } | null>(null)

  useEffect(() => {
    if (isOpen && user) {
      loadMigrationPreview()
    }
  }, [isOpen, user])

  const loadMigrationPreview = async () => {
    try {
      const previewData = await migrationService.previewMigration()
      setPreview(previewData)
    } catch (error) {
      console.error('Error loading migration preview:', error)
    }
  }

  const handleMigrate = async () => {
    if (!user) {
      toast.error('Please sign in to migrate your data')
      return
    }

    setIsMigrating(true)
    try {
      const result = await migrationService.migrateUserData()
      setMigrationResult(result)
      
      if (result.success && result.errors.length === 0) {
        toast.success('Data migrated successfully!')
        setTimeout(() => {
          onClose()
        }, 2000)
      } else if (result.errors.length > 0) {
        toast.error(`Migration completed with ${result.errors.length} errors`)
      }
    } catch (error) {
      console.error('Migration failed:', error)
      toast.error('Migration failed. Please try again.')
    } finally {
      setIsMigrating(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🚀 Data Migration</span>
            <Badge variant="outline">New Feature</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Migrate your localStorage data to the secure backend for better performance and cross-device sync.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!migrationResult && (
            <>
              {/* Migration Preview */}
              {preview && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Data to be migrated:</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Conversations</span>
                      <Badge variant="secondary">{preview.conversations}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Chart Settings</span>
                      <Badge variant={preview.chartSettings ? "default" : "outline"}>
                        {preview.chartSettings ? "Yes" : "No"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Preferences</span>
                      <Badge variant={preview.preferences ? "default" : "outline"}>
                        {preview.preferences ? "Yes" : "No"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Total Size</span>
                      <Badge variant="outline">{formatFileSize(preview.totalSize)}</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="space-y-3">
                <h3 className="font-semibold">Benefits of migration:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Cross-device synchronization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Secure backend storage
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Never lose your data again
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Better performance
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Multi-account isolation
                  </li>
                </ul>
              </div>

              {/* Migration Progress */}
              {isMigrating && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Migrating data...</span>
                    <span className="text-sm text-muted-foreground">Please wait</span>
                  </div>
                  <Progress value={undefined} className="w-full" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={onClose} disabled={isMigrating}>
                  Skip for now
                </Button>
                <Button 
                  onClick={handleMigrate} 
                  disabled={isMigrating || !preview?.totalSize}
                  className="min-w-[120px]"
                >
                  {isMigrating ? 'Migrating...' : 'Start Migration'}
                </Button>
              </div>
            </>
          )}

          {/* Migration Results */}
          {migrationResult && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {migrationResult.success ? '🎉' : '⚠️'}
                </div>
                <h3 className="font-semibold text-lg">
                  {migrationResult.success ? 'Migration Complete!' : 'Migration Issues'}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {migrationResult.migrated.conversations}
                  </div>
                  <div className="text-sm text-muted-foreground">Conversations</div>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {migrationResult.migrated.chartData}
                  </div>
                  <div className="text-sm text-muted-foreground">Chart Settings</div>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {migrationResult.migrated.preferences}
                  </div>
                  <div className="text-sm text-muted-foreground">Preferences</div>
                </div>
              </div>

              {migrationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Errors encountered:</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {migrationResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={onClose}>
                  {migrationResult.success ? 'Continue' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

