![](https://github.com/dzmitROCK/start/blob/master/app/favicon/android-chrome-512x512.png?raw=true)
# Стартовый шаблон для вёрстки
#### Документация в разработке
Все настройки в `gulpfile.js`   
Настройки деплоя на хостинг в `deploy.json`   
##### Установка
* `git clone https://github.com/dzmitROCK/pro100-gulp.git my-project` клонируем репозиторий
* `cd my-project` переходим в папку проекта
* `yarn` устанавливаем все зависимости и пакеты  
* **в `.gitignore` добавляем строчку `deploy.json` чтобы не попали в репозиторий настройки ftp**     
##### Использование
`yarn start` запуск разработки  
`yarn production` компиляция проекта в продакшен  
`yarn cacheme` очистить кэш  
`yarn plug` проверить какие плагины в автозагрузке и названия  
`yarn zip` архивация проекта  
`yarn deploy` загружаем на хостинг, предварительно настроив в `deploy.json` переменные. Обзательно добавьте этот файл в `.gitignore` после найстройки!!  
##### Использованы инструменты
* scss
* pug

### Плюшки
* [Foundation Docs ( документация )](https://foundation.zurb.com/sites/docs/) 
* [HTML Templates ( стартовые шаблоны )](https://foundation.zurb.com/templates) 
* [Building Blocks ( готовые решения )](https://foundation.zurb.com/building-blocks/index.html) 
* [Foundation Coding Resources ( несколько плюшек )](https://foundation.zurb.com/sites/resources.html) 
* [Сборка шрифтов](https://yadi.sk/d/MQRGiUls3NjPm2) 
* [Онлайн конвертер html в pug](http://html2jade.org/) 
