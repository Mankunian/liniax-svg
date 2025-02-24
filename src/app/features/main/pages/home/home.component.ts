import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {CommonModule} from "@angular/common";
import {CardModule} from "primeng/card";
import {Button} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {InputTextModule} from "primeng/inputtext";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardModule, Button, DialogModule, InputTextModule, // Добавь этот импорт
  ], // Добавляем сюда
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('svgContainer') svgContainer!: ElementRef;

  points: { x: number, y: number }[] = [];
  svgWidth = 1000; // Установи размеры SVG под твой план
  svgHeight = 600;
  selectedPoint: { x: number; y: number } | null = null;

  visibleDialog = false;

  ngAfterViewInit() {
    setTimeout(() => {
      this.svgContainer.nativeElement.getBoundingClientRect(); // Принудительное обновление размеров
    }, 0);
  }


  addPoint(event: MouseEvent) {
    const svg = this.svgContainer.nativeElement as SVGSVGElement;
    const point = svg.createSVGPoint();

    // Берем координаты относительно окна
    point.x = event.clientX;
    point.y = event.clientY;

    // Получаем матрицу трансформации
    const ctm = svg.getScreenCTM();
    if (!ctm) {
      console.warn("CTM не найдено, используем приближенные координаты.");
      this.points.push({x: point.x, y: point.y});
      return;
    }

    // Трансформируем координаты в систему SVG
    const svgPoint = point.matrixTransform(ctm.inverse());

    // Добавляем точку
    this.points = [...this.points, {x: svgPoint.x, y: svgPoint.y}];
  }


  showInfo(event: MouseEvent, point: { x: number, y: number }) {
    event.stopPropagation(); // Чтобы клик по точке не добавлял новую точку
    // alert(`Точка: X=${point.x}, Y=${point.y}`);
    this.selectedPoint = point; // Сохраняем точку
    console.log("Выбранная точка:", this.selectedPoint);
    this.visibleDialog = true;
  }
}
