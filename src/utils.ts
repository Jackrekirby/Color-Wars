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
