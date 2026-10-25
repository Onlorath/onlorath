import { AppState, CameraStateConfig } from '../types';

export const CAMERA_CONFIGS: Record<AppState, CameraStateConfig> = {
  HERO: {
    position: [0, 0.8, 8.5],
    target: [0, 0, 0],
    fov: 60,
  },
  PROJECTS: {
    position: [-5.2, 1.8, 7.0],
    target: [-2.0, 0.2, 0],
    fov: 52,
  },
  SKILLS: {
    position: [4.8, -1.2, 7.5],
    target: [2.5, 0, 0],
    fov: 55,
  },
  TERMINAL: {
    position: [0, -3.2, 5.5],
    target: [0, -1.2, 0],
    fov: 48,
  },
  CONTACT: {
    position: [0, 3.8, 8.2],
    target: [0, 0.5, 0],
    fov: 62,
  },
};

type StateListener = (state: AppState, prevState: AppState) => void;
type NodeFocusListener = (nodeId: string | null) => void;
type WarpListener = (isWarping: boolean) => void;

class SceneStateMachine {
  private currentState: AppState = 'HERO';
  private previousState: AppState = 'HERO';
  private focusedNodeId: string | null = null;
  private isWarping: boolean = false;

  private stateListeners: Set<StateListener> = new Set();
  private nodeListeners: Set<NodeFocusListener> = new Set();
  private warpListeners: Set<WarpListener> = new Set();

  public getState(): AppState {
    return this.currentState;
  }

  public getPreviousState(): AppState {
    return this.previousState;
  }

  public getFocusedNodeId(): string | null {
    return this.focusedNodeId;
  }

  public getIsWarping(): boolean {
    return this.isWarping;
  }

  public transitionTo(nextState: AppState, triggerWarp = true): void {
    if (this.currentState === nextState) return;

    this.previousState = this.currentState;
    this.currentState = nextState;

    if (triggerWarp) {
      this.isWarping = true;
      this.notifyWarpListeners(true);
      setTimeout(() => {
        this.isWarping = false;
        this.notifyWarpListeners(false);
      }, 700);
    }

    this.notifyStateListeners();
  }

  public setFocusedNode(nodeId: string | null): void {
    this.focusedNodeId = nodeId;
    this.notifyNodeListeners();
  }

  public subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  public subscribeNode(listener: NodeFocusListener): () => void {
    this.nodeListeners.add(listener);
    return () => this.nodeListeners.delete(listener);
  }

  public subscribeWarp(listener: WarpListener): () => void {
    this.warpListeners.add(listener);
    return () => this.warpListeners.delete(listener);
  }

  private notifyStateListeners(): void {
    this.stateListeners.forEach((fn) => fn(this.currentState, this.previousState));
  }

  private notifyNodeListeners(): void {
    this.nodeListeners.forEach((fn) => fn(this.focusedNodeId));
  }

  private notifyWarpListeners(warping: boolean): void {
    this.warpListeners.forEach((fn) => fn(warping));
  }
}

export const sceneFSM = new SceneStateMachine();
