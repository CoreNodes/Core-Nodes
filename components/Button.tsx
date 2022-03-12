import { MouseEventHandler, ReactElement } from "react";
import { LoadingSpinner } from "./Icons";

export const Button: React.FC<{
  primary?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  icon?: ReactElement;
  text: string;
}> = (props) => (
  <button
    disabled={props.disabled}
    onClick={props.onClick}
    className={`flex justify-center items-center text-lg space-x-2 py-2 px-4 rounded-sm shadow-lg disabled:cursor-not-allowed ${
      props.primary
        ? props.loading
          ? "bg-[#782319]"
          : "bg-[#A63023] hover:bg-[#782319]"
        : props.loading
        ? "bg-[#1F4679]"
        : "bg-[#2B60A6] hover:bg-[#1F4679]"
    }`}
  >
    {props.loading ? <LoadingSpinner /> : props.icon}
    <p>{props.text}</p>
  </button>
);

export const ButtonLink: React.FC<{ href: string; text: string }> = (props) => (
  <a href={props.href} target="_blank" rel="noreferrer">
    <Button text={props.text}>{props.children}</Button>
  </a>
);
