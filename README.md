![](https://github.com/dzmitROCK/start/blob/master/app/favicon/android-chrome-512x512.png?raw=true)
# Стартовый шаблон для вёрстки *
#### Документация в разработке
Все настройки в `gulpfile.js`   
Настройки деплоя на хостинг в `deploy.json`   
##### Установка
* `git clone https://github.com/dzmitROCK/starter-mini-gulp.git my-project` клонируем репозиторий
* `cd my-project` переходим в папку проекта
* `yarn` устанавливаем все зависимости и пакеты  
* в `.gitignore` добавляем строчку `deploy.json` чтобы не попали в репозиторий настройки ftp     
##### Использование
`yarn start` запуск разработки  
`yarn production` компиляция проекта в продакшен   
`yarn cacheme` очистить кэш  
`yarn plug` проверить какие плагины в автозагрузке и названия  
`yarn zip` архивация проекта  
`yarn deploy` загружаем на хостинг, предварительно настроив в `deploy.json` переменные. Добавте этот файд в `.gitignore` обзательно после найстройки !!  
##### Использованы препроцессоры
* scss
* pug