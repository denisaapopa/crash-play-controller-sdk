import { ComponentProps, PropsWithChildren } from "react";
import { Currency } from "@enigma-lake/zoot-platform-sdk";
export type Props = PropsWithChildren<ComponentProps<"input">> & {
    switcherConfig: {
        onSwitch: () => void;
        isPlaying: boolean;
        enabled: boolean;
        currency: Currency;
        disabled: boolean;
    };
    currency: Currency;
    label?: string;
};
declare const InputWithSwitch: ({ children, switcherConfig, disabled, currency, label, className, ...restProps }: Props) => import("react/jsx-runtime").JSX.Element;
export default InputWithSwitch;
