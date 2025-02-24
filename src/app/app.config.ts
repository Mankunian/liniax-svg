import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import 'primeng/resources/themes/lara-light-blue/theme.css';
import 'primeng/resources/primeng.min.css';

import { routes } from './app.routes';
import {provideAnimations} from "@angular/platform-browser/animations";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations() // ✅ Добавляем поддержку анимаций
  ]
};
