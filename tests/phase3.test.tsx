import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionArea from '../app/components/game/ActionArea';
import { GameState, Player, ActionCard } from '@doronuma/shared';
import React from 'react';

// useGameActions をモック化
vi.mock('../app/hooks/useGameActions', () => ({
  useGameActions: () => ({
    executeTurn: vi.fn(),
  }),
}));

// next/image をモック化
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

describe('Phase 3: Discard Card Selection UI', () => {
  const dummyGameState: GameState = {
    phase: 'playing',
    currentTurnPlayerId: 'player1',
    turnOrder: ['player1', 'player2'],
    turnNumber: 1,
    deckRemaining: 10,
    discardCount: 0,
    suddenDeathTriggered: false,
    suddenDeathTriggeredBy: null,
    targetActionCount: null,
    actionCountPerPlayer: { player1: 0, player2: 0 },
    turnDeadline: Date.now() + 10000,
    interruptDeadline: null,
    currentAction: null,
    interruptStack: [],
    synthesisPhase: false,
    victoryCards: { player1: [], player2: [] }
  };

  const dummyPlayer: Player = {
    playerId: 'player1',
    name: 'Player 1',
    score: 0,
    handCount: 3,
    status: 'playing',
    joinedAt: Date.now(),
    consecutiveTimeouts: 0
  };

  const dummyHand: ActionCard[] = [
    { id: 'card1', type: 'GainOne' },
    { id: 'card2', type: 'Harassment' },
    { id: 'card3', type: 'Nullify' },
  ];

  it('should render discard card selection UI correctly when pendingAction is discardPlayTwo and discardCardId is null', () => {
    const setDiscardCardId = vi.fn();
    const setSelectedCardIds = vi.fn();

    render(
      <ActionArea
        roomId="room1"
        gameState={dummyGameState}
        player={dummyPlayer}
        hand={dummyHand}
        selectedCardIds={[]}
        selectedTargetId={null}
        discardCardId={null}
        setDiscardCardId={setDiscardCardId}
        setSelectedCardIds={setSelectedCardIds}
      />
    );

    // アクション選択画面が表示されているはず。
    // 「行動カードを1枚捨てて2枚まで使う」ボタンを押す
    const actionButton = screen.getByText('行動カードを1枚捨てて2枚まで使う');
    fireEvent.click(actionButton);

    // 捨てカード選択UIが表示されることを確認
    expect(screen.getByText('捨てるカードを1枚選んでください：')).toBeDefined();

    // カード画像（モックされた img）が手札の枚数分（3つ）表示されることを確認
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(3);

    // 最初は「確定」ボタンが disabled であることを確認
    const confirmButton = screen.getByText('確定');
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true);

    // 1番目のカードをクリックして選択状態にする
    fireEvent.click(images[0].closest('button')!);

    // 確定ボタンが活性化されることを確認
    expect((confirmButton as HTMLButtonElement).disabled).toBe(false);

    // 確定ボタンをクリック
    fireEvent.click(confirmButton);

    // 親の setDiscardCardId がクリックされたカードの ID で呼び出されることを確認
    expect(setDiscardCardId).toHaveBeenCalledWith('card1');
  });
});
