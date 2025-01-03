// ==UserScript==
// @name         消息导航功能 for ChatGPT
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  消息导航功能 for ChatGPT，支持深色模式和浅色模式自动切换，默认收起导航栏
// @author       telly3e
// @match        https://chatgpt.com/*
// @grant        none
// @updateURL    https://github.com/telly3e/ChatGPT-message-navigation/raw/refs/heads/master/script.user.js
// @downloadURL  https://github.com/telly3e/ChatGPT-message-navigation/raw/refs/heads/master/script.user.js
// @supportURL   https://github.com/telly3e/ChatGPT-message-navigation/issues
// @homepageURL  https://github.com/telly3e/ChatGPT-message-navigation/
// ==/UserScript==

(function () {
    'use strict';

    console.log('脚本已加载');

    let currentUrl = window.location.href;
    let navigationVisible = false; // 默认隐藏导航栏
    let observer = null;
    let container;

    // 深色和浅色模式的样式
    const styles = {
        light: {
            background: '#f9f9f9',
            border: '#ccc',
            color: '#000',
            link: '#007bff',
            navBackground: '#e6f7ff',
            navHover: '#bae7ff',
        },
        dark: {
            background: '#2c2c2c',
            border: '#444',
            color: '#fff',
            link: '#4dabf7',
            navBackground: '#3c3c3c',
            navHover: '#555',
        },
    };

    function getCurrentStyle() {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return isDarkMode ? styles.dark : styles.light;
    }

    function initScript() {
        console.log('初始化脚本');

        let outerContainer = document.querySelector('div.h-full');
        if (!outerContainer) {
            console.warn('未找到 h-full 容器，等待页面加载完成...');
            return;
        }

        let messageContainer = null;

        function findMessageContainer() {
            if (!messageContainer) {
                messageContainer = outerContainer.querySelector('[class*="react-scroll-to-bottom"]');
                if (messageContainer) {
                    console.log('找到消息容器:', messageContainer);
                    initNavigation(messageContainer);
                } else {
                    console.warn('消息容器未找到，请检查结构');
                }
            }
        }

        function initNavigation(container) {
            console.log('初始化导航功能');

            const currentStyle = getCurrentStyle();

            // 清除旧的导航栏和按钮
            const existingNav = document.getElementById('tm-message-navigation');
            const existingButton = document.getElementById('tm-toggle-button');
            if (existingNav) existingNav.remove();
            if (existingButton) existingButton.remove();

            // 创建新的导航栏
            const navigation = document.createElement('div');
            navigation.id = 'tm-message-navigation';
            navigation.innerHTML = `
                <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">用户消息导航</h3>
                <ul style="list-style: none; padding: 0; margin: 0;"></ul>
            `;
            navigation.style = `
                position: fixed;
                top: 50px;
                right: 20px;
                width: 250px;
                max-height: 70%;
                overflow-y: auto;
                border-radius: 15px;
                padding: 10px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                background: ${currentStyle.background};
                border: 1px solid ${currentStyle.border};
                color: ${currentStyle.color};
                display: none; /* 默认隐藏导航栏 */
            `;
            document.body.appendChild(navigation);

            // 创建固定按钮
            const toggleButton = document.createElement('div');
            toggleButton.id = 'tm-toggle-button';
            toggleButton.innerText = '导航开关';
            toggleButton.style = `
                position: fixed;
                top: 56px;
                right: 45px;
                z-index: 1001;
                background: ${currentStyle.link};
                color: ${currentStyle.color};
                border: none;
                border-radius: 5px;
                padding: 10px 15px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                user-select: none; /* 禁止文本选择 */
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            `;
            document.body.appendChild(toggleButton);

            toggleButton.addEventListener('click', () => {
                navigationVisible = !navigationVisible;
                navigation.style.display = navigationVisible ? 'block' : 'none';
            });

            function updateNavigation() {
                const navList = navigation.querySelector('ul');
                navList.innerHTML = '';
                const userMessages = container.querySelectorAll('[data-message-author-role="user"]');
                console.log('检测到用户消息数量:', userMessages.length);

                userMessages.forEach((message, index) => {
                    const messageId = `user-message-${index + 1}`;
                    message.id = messageId;

                    const navItem = document.createElement('li');
                    navItem.style = `
                        margin: 5px 0;
                        padding: 5px;
                        background-color: ${currentStyle.navBackground};
                        border-radius: 5px;
                        transition: background-color 0.3s;
                        cursor: pointer;
                    `;
                    navItem.addEventListener('mouseover', () => {
                        navItem.style.backgroundColor = currentStyle.navHover;
                    });
                    navItem.addEventListener('mouseout', () => {
                        navItem.style.backgroundColor = currentStyle.navBackground;
                    });

                    navItem.innerHTML = `<a href="#${messageId}" style="text-decoration: none; color: ${currentStyle.link};">${message.textContent.slice(0, 20)}...</a>`;
                    navList.appendChild(navItem);
                });
            }

            const observer = new MutationObserver(updateNavigation);
            observer.observe(container, { childList: true, subtree: true });

            updateNavigation();
        }

        const containerObserver = new MutationObserver(() => {
            findMessageContainer();
        });

        containerObserver.observe(outerContainer, { childList: true, subtree: true });

        // 检测 URL 变化并重新初始化
        if (!observer) {
            observer = new MutationObserver(() => {
                if (window.location.href !== currentUrl) {
                    currentUrl = window.location.href;
                    console.log('检测到 URL 变化:', currentUrl);
                    messageContainer = null;
                    findMessageContainer();
                }
            });
        }
        observer.observe(document.querySelector('title'), { subtree: true, characterData: true, childList: true });

        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            console.log('检测到系统主题切换');
            initNavigation(container);
        });
    }

    initScript();
})();
