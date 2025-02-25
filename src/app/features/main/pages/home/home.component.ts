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
  @ViewChild('transformGroup') transformGroup!: ElementRef;
  originalViewBox = ''; // Изначальное значение viewBox
  points: { pointName: string; coordinateX: number; coordinateY: number; description: string; id: number }[] = [];
  svgWidth = 800; // Размер SVG (подстрой под твои данные)
  svgHeight = 600;
  scale = 1;
  panX = 0;
  panY = 0;
  lastPanX = 0;
  lastPanY = 0;
  lastScale = 1;


  selectedPoint: MockData | null = null;

  visibleDialog = false;
  svgForm!: FormGroup;
  mockData: MockData[] = [];

  constructor(
    private storage: StorageService
  ) {
    this.originalViewBox = `0 0 ${this.svgWidth} ${this.svgHeight}`;
  }

  ngAfterViewInit() {
    const hammer = new Hammer(this.svgContainer.nativeElement);

    hammer.get('pinch').set({enable: true});
    hammer.get('pan').set({direction: Hammer.DIRECTION_ALL});

    hammer.on('pinch', (event) => this.onPinch(event));
    hammer.on('pan', (event) => this.onPan(event));
    hammer.on('pinchend', () => this.onPinchEnd());
    hammer.on('panend', () => this.onPanEnd());

    this.svgContainer.nativeElement.addEventListener('wheel', (event: WheelEvent) => this.onWheel(event));


    setTimeout(() => {
      this.svgContainer.nativeElement.getBoundingClientRect(); // Принудительное обновление размеров
    }, 0);
  }

  onPinch(event: HammerInput) {
    this.scale = Math.max(0.5, Math.min(3, this.lastScale * event.scale));
    this.updateTransform();
  }

  onPinchEnd() {
    this.lastScale = this.scale;
  }

  onPan(event: HammerInput) {
    this.panX = this.lastPanX + event.deltaX;
    this.panY = this.lastPanY + event.deltaY;
    this.updateTransform();
  }

  onPanEnd() {
    this.lastPanX = this.panX;
    this.lastPanY = this.panY;
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    this.scale = Math.max(0.5, Math.min(3, this.scale * zoomFactor));
    this.updateTransform();
  }

  updateTransform() {
    this.transformGroup.nativeElement.setAttribute(
      'transform',
      `translate(${this.panX}, ${this.panY}) scale(${this.scale})`
    );
  }

  onDoubleClick(event: MouseEvent) {
    event.preventDefault();
    this.addPoint(event);
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
    const svg = this.svgContainer.nativeElement as SVGSVGElement;
    // Проверяем, изменился ли viewBox
    if (svg.getAttribute('viewBox') !== this.originalViewBox) {
      alert('Вернитесь в исходное положение перед добавлением точки.');
      return;
    }


    this.svgForm.reset();
    const rect = svg.getBoundingClientRect(); // Размеры SVG в пикселях

    // Преобразуем координаты клика в систему SVG
    const scaleX = this.svgWidth / rect.width;
    const scaleY = this.svgHeight / rect.height;
    const svgX = (event.clientX - rect.left) * scaleX;
    const svgY = (event.clientY - rect.top) * scaleY;

    // Добавляем точку в список
    this.addPointToList(svgX, svgY);

    // Заполняем форму
    this.svgForm.patchValue({
      coordinateX: svgX,
      coordinateY: svgY,
      id: null,
      pointName: null,
      description: null
    });

    this.selectedPoint = this.svgForm.value;

    // Открываем модалку через 1 сек.
    setTimeout(() => {
      this.visibleDialog = true;
    }, 1000);
  }

  private addPointToList(x: number, y: number) {
    this.points = [...this.points, {description: "", id: 0, pointName: "", coordinateX: x, coordinateY: y}];
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
