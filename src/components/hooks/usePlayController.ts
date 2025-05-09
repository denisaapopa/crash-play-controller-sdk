import { AUTO_PLAY_STATE } from "../../types";
import { PlaySide } from "../../types/playController";
import { useAutoManualPlayState } from "../AutoManualPlayStateProvider/AutoManualPlayStateContext";
import { ChangeEvent, FocusEvent, useRef } from "react";

export const usePlayController = (side: PlaySide) => {
  const {
    config,
    mode,
    autoPlay: {
      setNumberOfPlays,
      numberOfPlays,
      setPlayedRounds,
      playedRounds,
      setState,
      state,
    },
  } = useAutoManualPlayState();

  const { currentCurrency, currencies } = config.currencyOptions;
  const {
    isPlaying,
    canCashout,
    disabledController,
    disabledMenu,
    autoPlayDelay = 1000,
    playHook,
    lastPlayedSide,
  } = config.playOptions;

  const {
    leftPlayAmount,
    rightPlayAmount,
    setLeftBetAmount,
    setRightBetAmount,
    playLimits,
  } = playHook?.() ?? {};
  const minPlayAmount = playLimits?.[currentCurrency]?.limits.min ?? 0;
  const maxPlayAmount = playLimits?.[currentCurrency]?.limits.max ?? 0;
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoplayActiveRef = useRef(false);

  const playAmount = side === PlaySide.LEFT ? leftPlayAmount : rightPlayAmount;
  const setPlayAmount =
    side === PlaySide.LEFT ? setLeftBetAmount : setRightBetAmount;

  const stopAutoplay = () => {
    isAutoplayActiveRef.current = false;
    if (playIntervalRef.current) {
      clearTimeout(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    setState(AUTO_PLAY_STATE.IDLE);
    setTimeout(() => {
      setPlayedRounds(0);
    }, autoPlayDelay);
  };

  const loopRounds = (
    currentPlayedRounds: number,
    remainingPlays: number,
    playSide: PlaySide,
  ) => {
    if (!isAutoplayActiveRef.current) {
      return;
    }

    if (remainingPlays < 1 || numberOfPlays === 0) {
      setNumberOfPlays(Infinity);
      stopAutoplay();
      return;
    }

    setPlayedRounds(currentPlayedRounds + 1);
    setNumberOfPlays((prev) => Math.max(prev - 1, 0));

    config.onAutoPlay(
      () => {
        if (!isAutoplayActiveRef.current) {
          return;
        }

        playIntervalRef.current = setTimeout(
          () =>
            loopRounds(currentPlayedRounds + 1, remainingPlays - 1, playSide),
          autoPlayDelay,
        );
      },
      stopAutoplay,
      playSide,
    );
  };

  const handleAutoPlay = (playSide: PlaySide) => {
    if (disabledController) {
      return;
    }

    isAutoplayActiveRef.current = true;
    setState(AUTO_PLAY_STATE.PLAYING);

    loopRounds(playedRounds, numberOfPlays, playSide);
  };

  const isDisabled = () =>
    (disabledController || isPlaying || disabledMenu) &&
    side !== lastPlayedSide;

  const isAutoplayDisabled = () =>
    disabledController || state === AUTO_PLAY_STATE.PLAYING;

  const adjustPlayAmount = (multiplier: number) => {
    if (isDisabled()) {
      return;
    }
    const newAmount = Math.max(
      minPlayAmount,
      Math.min(playAmount * multiplier, maxPlayAmount),
    );
    setPlayAmount(Number(newAmount.toFixed(2)));
  };

  const onChangeAmount = (event: ChangeEvent<HTMLInputElement>) => {
    if (isDisabled()) {
      return;
    }
    setPlayAmount(Number(event.currentTarget.value));
  };

  const onBlurAmount = (event: FocusEvent<HTMLInputElement>) => {
    if (isDisabled()) {
      return;
    }
    const newAmount = Number(event.currentTarget.value);
    setPlayAmount(Math.max(minPlayAmount, Math.min(newAmount, maxPlayAmount)));
  };

  const isValidPlayAmount =
    playAmount >= minPlayAmount && playAmount <= maxPlayAmount;

  return {
    currentCurrency,
    currencies,
    playAmount,
    minPlayAmount,
    maxPlayAmount,
    setPlayAmount,
    adjustPlayAmount,
    onChangeAmount,
    onBlurAmount,
    playOptions: config.playOptions,
    isValidPlayAmount,
    mode,
    lastPlayedSide,
    manualPlay: {
      isDisabled,
      onPlay: (playSide: PlaySide) => config.onPlay(playSide),
      canCashout,
    },
    autoPlay: {
      isDisabled: isAutoplayDisabled,
      state,
      onPlay: handleAutoPlay,
      onStopPlay: stopAutoplay,
    },
  };
};
