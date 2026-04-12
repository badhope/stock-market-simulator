export const formatMoney = (num: number, decimals = 2): string => {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export const formatVolume = (num: number): string => {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toString()
}

export const formatPercent = (num: number): string => {
  const sign = num >= 0 ? '+' : ''
  return sign + num.toFixed(2) + '%'
}
