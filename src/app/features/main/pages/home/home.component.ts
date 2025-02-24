import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule], // Добавляем сюда
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit{
  @ViewChild('svgContainer') svgContainer!: ElementRef;

  points: { x: number, y: number }[] = [];
  svgWidth = 1000; // Установи размеры SVG под твой план
  svgHeight = 600;

  ngAfterViewInit() {
    const svg = this.svgContainer.nativeElement as SVGSVGElement;
    const rect = svg.getBoundingClientRect();

    // Если надо, можно получить реальные размеры
    this.svgWidth = rect.width;
    this.svgHeight = rect.height;
  }

  addPoint(event: MouseEvent) {
    const svg = this.svgContainer.nativeElement as SVGSVGElement;
    const point = svg.createSVGPoint();

    point.x = event.clientX;
    point.y = event.clientY;

    const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

    this.points.push({ x: svgPoint.x, y: svgPoint.y });
  }

  showInfo(event: MouseEvent, point: { x: number, y: number }) {
    event.stopPropagation(); // Чтобы клик по точке не добавлял новую точку
    alert(`Точка: X=${point.x}, Y=${point.y}`);
  }
}
