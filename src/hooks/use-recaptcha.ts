"use client"

import { useState, useCallback, useRef, useEffect } from 'react'

export interface RecaptchaHookReturn {
  token: string | null
  isLoading: boolean
  error: string | null
  refreshToken: (action?: string) => Promise<string>
  resetError: () => void
}

// Get the site key from environment variables
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' // Fallback test key

export function useRecaptcha(): RecaptchaHookReturn {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const tokenRef = useRef<string | null>(null)

  // Load reCAPTCHA script
  useEffect(() => {
    const loadRecaptchaScript = () => {
      // Check if script is already loaded
      if (window.grecaptcha) {
        setScriptLoaded(true)
        return
      }

      // Check if script tag already exists
      if (document.querySelector('script[src*="recaptcha"]')) {
        return
      }

      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
      script.async = true
      script.defer = true
      
      script.onload = () => {
        setScriptLoaded(true)
      }
      
      script.onerror = () => {
        setError('Failed to load reCAPTCHA script')
      }

      document.head.appendChild(script)
    }

    loadRecaptchaScript()
  }, [])

  const refreshToken = useCallback(async (action: string = 'submit'): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      // Wait for script to load
      if (!scriptLoaded || !window.grecaptcha) {
        throw new Error('reCAPTCHA not loaded yet. Please try again.')
      }

      // Wait for reCAPTCHA to be ready
      await new Promise<void>((resolve) => {
        window.grecaptcha.ready(() => resolve())
      })

      // Execute reCAPTCHA and get token
      const recaptchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
        action: action
      })

      if (!recaptchaToken) {
        throw new Error('Failed to generate reCAPTCHA token')
      }
      
      setToken(recaptchaToken)
      tokenRef.current = recaptchaToken
      
      return recaptchaToken
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh reCAPTCHA token'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [scriptLoaded])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return {
    token: tokenRef.current,
    isLoading,
    error,
    refreshToken,
    resetError
  }
}

// Custom hook for handling reCAPTCHA token refresh on auth failures
export function useRecaptchaWithRetry() {
  const { token, isLoading, error, refreshToken, resetError } = useRecaptcha()
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const handleAuthError = useCallback(async (error: unknown, action: string = 'submit'): Promise<string> => {
    // Check if error is related to invalid reCAPTCHA token
    const errorMessage = error instanceof Error ? error.message : ''
    const errorStatus = (error as { status?: number })?.status
    const isRecaptchaError = errorMessage.toLowerCase().includes('recaptcha') ||
                           errorMessage.toLowerCase().includes('captcha') ||
                           errorStatus === 400

    if (isRecaptchaError && retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      return await refreshToken(action)
    }
    
    throw error
  }, [refreshToken, retryCount, maxRetries])

  const resetRetry = useCallback(() => {
    setRetryCount(0)
    resetError()
  }, [resetError])

  return {
    token,
    isLoading,
    error,
    refreshToken,
    handleAuthError,
    resetRetry,
    retryCount,
    maxRetries
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    grecaptcha: any;
  }
}
