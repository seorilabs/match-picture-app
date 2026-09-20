export function neutralizeGeminiKeyFalsePositiveSource(source: string): string {
  return source.replaceAll('FAQ.html', 'FAQ_html')
}
