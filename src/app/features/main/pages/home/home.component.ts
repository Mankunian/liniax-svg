import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from "@angular/common";
import {CardModule} from "primeng/card";
import {Button} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {InputTextModule} from "primeng/inputtext";
import {ReactiveFormsModule} from "@angular/forms";
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {InputTextareaModule} from "primeng/inputtextarea";
import {StorageService} from "../../../../services/storage.service";

interface MockData {
  id: number,
  pointName: string,
  description: string,
  coordinateX: number,
  coordinateY: number
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardModule, Button, DialogModule, InputTextModule, ReactiveFormsModule, InputTextareaModule, // Добавь этот импорт
  ], // Добавляем сюда
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit, OnInit {
  @ViewChild('svgContainer') svgContainer!: ElementRef;

  points: { x: number, y: number }[] = [];
  svgWidth = 1000; // Установи размеры SVG под твой план
  svgHeight = 600;
  selectedPoint: { x: number; y: number } | null = null;

  visibleDialog = false;
  svgForm!: FormGroup;
  mockData!: MockData

  constructor(
    private storage: StorageService
  ) {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.svgContainer.nativeElement.getBoundingClientRect(); // Принудительное обновление размеров
    }, 0);
  }

  ngOnInit(): void {
    this.initForm();
    this.getMockData();
  }

  initForm() {
    this.svgForm = new FormGroup({
      coordinateX: new FormControl(null),
      coordinateY: new FormControl(null),
      id: new FormControl(null),
      pointName: new FormControl(null),
      description: new FormControl(null)
    })
  }

  getMockData() {
    this.mockData = this.storage.getItem('mockData');
    console.log(this.mockData)
    this.svgForm.get('coordinateX')?.setValue(this.mockData.coordinateX)
    this.svgForm.get('coordinateY')?.setValue(this.mockData.coordinateY)
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

    this.bindForm();
  }

  bindForm() {
    this.svgForm.get('coordinateX')?.setValue(this.selectedPoint?.x);
    this.svgForm.get('coordinateY')?.setValue(this.selectedPoint?.y);
  }

  saveNewPoint() {
    if (this.storage.existItem('mockData')) {
      const mockData = this.storage.getItem('mockData');
      if (mockData && mockData.length > 0) {
        const lastItem = mockData[mockData.length - 1]; // Берем последний элемент массива
        this.svgForm.get('id')?.setValue(lastItem.id + 1);
      } else {
        this.svgForm.get('id')?.setValue(0);
      }
      this.storage.setItem('mockData', this.svgForm.value)
    } else {
      this.svgForm.get('id')?.setValue(0);
      this.storage.setItem('mockData', this.svgForm.value)
    }
    this.visibleDialog = false;
  }
}
