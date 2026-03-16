import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { translations, defaultLanguage, getTranslation } from '../i18n';

// 創建 Context
const LanguageContext = createContext();

// localStorage key
const LANGUAGE_STORAGE_KEY = 'inpack-language';

/**
 * Language Provider Component
 * 提供語言狀態管理和翻譯功能
 */
export function LanguageProvider({ children }) {
    // 從 localStorage 讀取語言設定，如果沒有則使用預設語言
    const [language, setLanguageState] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (stored && translations[stored]) {
                return stored;
            }
        }
        return defaultLanguage;
    });

    // 當前語言的翻譯物件
    const currentTranslations = translations[language] || translations[defaultLanguage];

    // 設定語言的函數
    const setLanguage = useCallback((lang) => {
        if (translations[lang]) {
            setLanguageState(lang);
            localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        } else {
            console.warn(`Language "${lang}" is not supported`);
        }
    }, []);

    // 翻譯函數
    const t = useCallback((path, params = {}) => {
        return getTranslation(currentTranslations, path, params);
    }, [currentTranslations]);

    // 當語言變更時，更新 localStorage
    useEffect(() => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }, [language]);

    const value = {
        language,
        setLanguage,
        t,
        translations: currentTranslations,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

/**
 * Custom hook to use language context
 * @returns {{ language: string, setLanguage: (lang: string) => void, t: (path: string, params?: object) => string }}
 */
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

/**
 * Custom hook for translations only (alias for cleaner code)
 * @returns {(path: string, params?: object) => string}
 */
export function useTranslation() {
    const { t } = useLanguage();
    return t;
}

export default LanguageContext;
