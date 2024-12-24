import { CallbackHandler } from './types'

export const FormatDate = (date: Date): string => {
  const pad = (num: number): string => (num < 10 ? '0' + num : num.toString())

  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear().toString()
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export const Sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const NewCallbackHandler = (): CallbackHandler => {
  const callbacks: VoidFunction[] = []

  // Method to add a callback
  const addCallback = (callback: VoidFunction): void => {
    if (typeof callback === 'function') {
      callbacks.push(callback)
    } else {
      console.error('Callback must be a function')
    }
  }

  // Method to trigger the event
  const triggerCallbacks = (): void => {
    callbacks.forEach(callback => callback())
  }

  return {
    addCallback,
    triggerCallbacks
  }
}

const addLeadingZeros = (num: number, totalLength: number) => {
  return num.toString().padStart(totalLength, '0')
}

export const millisToMMSS = (millis: number) => {
  const totalSeconds = Math.floor(millis / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${addLeadingZeros(minutes, 2)}:${addLeadingZeros(seconds, 2)}`
}
