import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import Hammer from 'hammerjs';

@Component({
  selector: 'app-hammer-zoom',
  standalone: true,
  imports: [],
  templateUrl: './hammer-zoom.component.html',
  styleUrl: './hammer-zoom.component.scss'
})
export class HammerZoomComponent implements AfterViewInit{
  @ViewChild('svgContainer') svgContainer!: ElementRef;
  @ViewChild('transformGroup') transformGroup!: ElementRef;

  private scale = 1;
  private panX = 0;
  private panY = 0;
  private lastPanX = 0;
  private lastPanY = 0;

  ngAfterViewInit() {
    const hammer = new Hammer(this.svgContainer.nativeElement);

    hammer.get('pinch').set({ enable: true });
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    hammer.on('pinch', (event) => this.onPinch(event));
    hammer.on('pan', (event) => this.onPan(event));
    hammer.on('pinchend', () => this.onPinchEnd());
    hammer.on('panend', () => this.onPanEnd());
  }

  onPinch(event: HammerInput) {
    this.scale = Math.max(0.5, Math.min(3, event.scale)); // Ограничение зума от 0.5x до 3x
    this.updateTransform();
  }

  onPan(event: HammerInput) {
    this.panX = this.lastPanX + event.deltaX;
    this.panY = this.lastPanY + event.deltaY;
    this.updateTransform();
  }

  onPinchEnd() {
    this.lastPanX = this.panX;
    this.lastPanY = this.panY;
  }

  onPanEnd() {
    this.lastPanX = this.panX;
    this.lastPanY = this.panY;
  }

  updateTransform() {
    this.transformGroup.nativeElement.setAttribute(
      'transform',
      `translate(${this.panX}, ${this.panY}) scale(${this.scale})`
    );
  }
}
