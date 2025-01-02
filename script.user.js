// ==UserScript==
// @name         消息导航功能 for ChatGPT
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  消息导航功能 for ChatGPT
// @author       YourName
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log('脚本已加载');

    let currentUrl = window.location.href;
    let navigationVisible = true;
    let observer = null;

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

            // 清除旧的导航栏和按钮
            const existingNav = document.getElementById('tm-message-navigation');
            const existingButton = document.getElementById('tm-toggle-button');
            if (existingNav) existingNav.remove();
            if (existingButton) existingButton.remove();

            // 创建新的导航栏
            const navigation = document.createElement('div');
            navigation.id = 'tm-message-navigation';
            navigation.innerHTML = `
                <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: rgb(0, 0, 0);">用户消息导航</h3>
                <ul style="list-style: none; padding: 0; margin: 0;"></ul>
            `;
            navigation.style = `
                position: fixed;
                top: 50px;
                right: 10px;
                width: 250px;
                max-height: 70%;
                overflow-y: auto;
                background: #f9f9f9;
                border: 1px solid #ccc;
                border-radius: 15px; /* 圆角边框 */
                padding: 10px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                font-family: Arial, sans-serif;
                font-size: 14px;
            `;
            document.body.appendChild(navigation);

            // 创建固定按钮
            const toggleButton = document.createElement('div');
            toggleButton.id = 'tm-toggle-button';
            toggleButton.innerText = '导航开关';
            toggleButton.style = `
                position: fixed;
                top: 55px; /* 靠下一点 */
                right: 35px;
                z-index: 1001;
                background: #007bff;
                color: #fff;
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
                        background-color: #e6f7ff;
                        border-radius: 5px;
                        transition: background-color 0.3s;
                        cursor: pointer;
                    `;
                    navItem.addEventListener('mouseover', () => {
                        navItem.style.backgroundColor = '#bae7ff';
                    });
                    navItem.addEventListener('mouseout', () => {
                        navItem.style.backgroundColor = '#e6f7ff';
                    });

                    navItem.innerHTML = `<a href="#${messageId}" style="text-decoration: none; color: #007bff;">${message.textContent.slice(0, 20)}...</a>`;
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
    }

    initScript();
})();
