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
import {isArray} from "@angular/compiler-cli/src/ngtsc/annotations/common";

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

  points: { pointName: string; coordinateX: number; coordinateY: number; description: string; id: number }[] = [];
  svgWidth = 1000; // Установи размеры SVG под твой план
  svgHeight = 600;
  selectedPoint: MockData | null = null;

  visibleDialog = false;
  svgForm!: FormGroup;
  mockData: MockData[] = [];


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
    this.mockData = this.storage.getItem('mockData') || [];

    if (!Array.isArray(this.mockData)) {
      this.mockData = []; // Защита от ошибок, если вдруг данные не массив
    }

    console.log(this.mockData);

    // Обновляем `points` для отрисовки точек в SVG
    this.points = this.mockData.map(item => ({
      coordinateX: item.coordinateX,
      coordinateY: item.coordinateY,
      pointName: item.pointName,
      description: item.description,
      id: item.id
    }))
  }


  addPoint(event: MouseEvent) {
    this.svgForm.reset();
    const svg = this.svgContainer.nativeElement as SVGSVGElement;
    const point = svg.createSVGPoint();

    // Берем координаты относительно окна
    point.x = event.clientX;
    point.y = event.clientY;

    // Получаем матрицу трансформации
    const ctm = svg.getScreenCTM();
    if (!ctm) {
      console.warn("CTM не найдено, используем приближенные координаты.");
      this.points.push({description: "", id: 0, pointName: "", coordinateX: point.x, coordinateY: point.y});
      return;
    }

    // Трансформируем координаты в систему SVG
    const svgPoint = point.matrixTransform(ctm.inverse());

    // Добавляем точку
    // @ts-ignore
    this.points = [...this.points, {x: svgPoint.x, y: svgPoint.y}];


    this.svgForm.get('coordinateX')?.setValue(svgPoint.x);
    this.svgForm.get('coordinateY')?.setValue(svgPoint.y);
    this.svgForm.get('id')?.setValue(null);
    this.svgForm.get('pointName')?.setValue(null);
    this.svgForm.get('description')?.setValue(null);

    this.selectedPoint = this.svgForm.value;
    setTimeout(() => {
      this.visibleDialog = true;
    }, 1000)
  }


  showInfo(event: MouseEvent, point: any) {
    event.stopPropagation(); // Чтобы клик по точке не добавлял новую точку
    this.selectedPoint = point; // Сохраняем точку

    this.visibleDialog = true;
    this.bindForm();

  }

  bindForm() {
    this.svgForm.get('coordinateX')?.setValue(this.selectedPoint?.coordinateX);
    this.svgForm.get('coordinateY')?.setValue(this.selectedPoint?.coordinateY);
    this.svgForm.get('pointName')?.setValue(this.selectedPoint?.pointName);
    this.svgForm.get('description')?.setValue(this.selectedPoint?.description);
    this.svgForm.get('id')?.setValue(this.selectedPoint?.id);
  }

  saveNewPoint() {
    let mockData = this.storage.getItem('mockData') || []; // Загружаем данные

    if (!Array.isArray(mockData)) {
      mockData = []; // Если данные не массив, создаем новый
    }

    let newId = 0;
    if (mockData.length > 0) {
      const lastItem = mockData[mockData.length - 1];
      newId = lastItem.id + 1;
    }

    this.svgForm.get('id')?.setValue(newId);

    // Добавляем новый объект в массив
    mockData.push(this.svgForm.value);

    // Сохраняем обновленный массив
    this.storage.setItem('mockData', mockData);

    // Обновляем массив точек для отображения
    // this.points = [...mockData];
    window.location.reload();

    // Закрываем диалог
    // this.visibleDialog = false;


  }

}
