import { GameState, FSMAction } from '../types';
import { useGameStore } from '../store/useGameStore';

describe('Game FSM', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('transitions from IDLE to PRE_MATCH_CONFIG on startMatchSetup', () => {
    const store = useGameStore.getState();
    expect(store.state).toBe(GameState.IDLE);
    
    store.transition('startMatchSetup');
    
    const newStore = useGameStore.getState();
    expect(newStore.state).toBe(GameState.PRE_MATCH_CONFIG);
  });

  it('transitions from PRE_MATCH_CONFIG to MATCHMAKING on confirmConfig', () => {
    const store = useGameStore.getState();
    store.transition('startMatchSetup');
    store.setConfig(5);
    
    const afterConfig = useGameStore.getState();
    expect(afterConfig.state).toBe(GameState.PRE_MATCH_CONFIG);
    
    store.transition('confirmConfig');
    
    const afterConfirm = useGameStore.getState();
    expect(afterConfirm.state).toBe(GameState.MATCHMAKING);
  });

  it('transitions from PRE_MATCH_CONFIG back to IDLE on cancelSetup', () => {
    const store = useGameStore.getState();
    store.transition('startMatchSetup');
    
    const afterSetup = useGameStore.getState();
    expect(afterSetup.state).toBe(GameState.PRE_MATCH_CONFIG);
    
    store.transition('cancelSetup');
    
    const afterCancel = useGameStore.getState();
    expect(afterCancel.state).toBe(GameState.IDLE);
  });

  it('rejects invalid transition from IDLE and stays in current state', () => {
    const store = useGameStore.getState();
    expect(store.state).toBe(GameState.IDLE);
    
    store.transition('submitAnswer');
    
    const newStore = useGameStore.getState();
    expect(newStore.state).toBe(GameState.IDLE);
  });

  it('rejects invalid transition from ROUND_ACTIVE without valid action', () => {
    const store = useGameStore.getState();
    store.transition('startMatchSetup');
    store.setConfig(5);
    store.transition('confirmConfig');
    store.transition('matchFound');
    
    const inRound = useGameStore.getState();
    expect(inRound.state).toBe(GameState.ROUND_ACTIVE);
    
    store.transition('cancelSetup');
    
    const afterInvalid = useGameStore.getState();
    expect(afterInvalid.state).toBe(GameState.ROUND_ACTIVE);
  });

  it('transitions from ROUND_ACTIVE to ROUND_RESULTS on submitAnswer', () => {
    const store = useGameStore.getState();
    store.transition('startMatchSetup');
    store.setConfig(5);
    store.transition('confirmConfig');
    store.transition('matchFound');
    
    const inRound = useGameStore.getState();
    expect(inRound.state).toBe(GameState.ROUND_ACTIVE);
    
    store.submitAnswer('A');
    
    const afterSubmit = useGameStore.getState();
    expect(afterSubmit.state).toBe(GameState.ROUND_RESULTS);
  });
});