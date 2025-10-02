import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 导入翻译资源
import translationEN from './locales/en/translation.json'
import translationZH from './locales/zh-CN/translation.json'

const resources = {
  en: {
    translation: translationEN
  },
  'zh-CN': {
    translation: translationZH
  }
}

i18n
  .use(LanguageDetector) // 检测用户语言
  .use(initReactI18next) // 传递 i18n 实例给 react-i18next
  .init({
    resources,
    fallbackLng: 'en', // 如果当前语言没有翻译则使用英语
    debug: false, // 开发时可以设置为 true 查看调试信息

    interpolation: {
      escapeValue: false // React 已经安全地处理了 XSS
    },

    detection: {
      // 语言检测配置
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

export default i18n
