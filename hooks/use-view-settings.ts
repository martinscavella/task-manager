'use client'

import { useState, useEffect, useCallback } from 'react'
import { ViewSettings, ViewMode, GroupBy, SortBy, SortOrder } from '@/lib/types'

const STORAGE_KEY = 'task-manager-view-settings'

const DEFAULT_SETTINGS: ViewSettings = {
  viewMode: 'grid',
  groupBy: 'none',
  sortBy: 'created_at',
  sortOrder: 'desc',
  filterStatus: [],
  filterPriority: [],
  searchQuery: '',
}

export function useViewSettings() {
  const [settings, setSettings] = useState<ViewSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Read from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings(prev => ({ ...DEFAULT_SETTINGS, ...parsed }))
      }
    } catch (error) {
      console.error('Failed to load view settings from localStorage:', error)
    }
    setIsLoaded(true)
  }, [])

  // Persist changes to localStorage immediately
  const updateSetting = useCallback((key: keyof ViewSettings, value: ViewSettings[keyof ViewSettings]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch (error) {
          console.error('Failed to save view settings to localStorage:', error)
        }
      }
      return updated
    })
  }, [])

  const setViewMode = useCallback((viewMode: ViewMode) => {
    updateSetting('viewMode', viewMode)
  }, [updateSetting])

  const setGroupBy = useCallback((groupBy: GroupBy) => {
    updateSetting('groupBy', groupBy)
  }, [updateSetting])

  const setSortBy = useCallback((sortBy: SortBy) => {
    updateSetting('sortBy', sortBy)
  }, [updateSetting])

  const setSortOrder = useCallback((sortOrder: SortOrder) => {
    updateSetting('sortOrder', sortOrder)
  }, [updateSetting])

  const setFilterStatus = useCallback((filterStatus: string[]) => {
    updateSetting('filterStatus', filterStatus)
  }, [updateSetting])

  const setFilterPriority = useCallback((filterPriority: string[]) => {
    updateSetting('filterPriority', filterPriority)
  }, [updateSetting])

  const setSearchQuery = useCallback((searchQuery: string) => {
    updateSetting('searchQuery', searchQuery)
  }, [updateSetting])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (error) {
        console.error('Failed to reset view settings:', error)
      }
    }
  }, [])

  return {
    settings,
    isLoaded,
    setViewMode,
    setGroupBy,
    setSortBy,
    setSortOrder,
    setFilterStatus,
    setFilterPriority,
    setSearchQuery,
    resetSettings,
  }
}
