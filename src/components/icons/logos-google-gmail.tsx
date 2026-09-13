import * as React from "react";

export function GoogleGmailIcon({
  size = 14,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & {
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      {...props}
    >
      {/* Right green-blue fold */}
      <path
        d="M78.4082 20.4547H99.9991V82.9545C99.9991 86.7199 96.9462 89.7727 93.1809 89.7727H81.8173C81.3696 89.7727 80.9263 89.6845 80.5127 89.5132C80.0991 89.3419 79.7233 89.0908 79.4067 88.7742C79.0901 88.4577 78.839 88.0818 78.6677 87.6682C78.4964 87.2546 78.4082 86.8113 78.4082 86.3636V20.4547Z"
        fill="url(#paint0_linear_gmail_right)"
      />
      {/* Left red fold */}
      <path
        d="M21.5909 20.4547H0V82.9545C0 86.7199 3.05283 89.7727 6.81816 89.7727H18.1818C18.6295 89.7727 19.0728 89.6845 19.4864 89.5132C19.9 89.3419 20.2758 89.0908 20.5924 88.7742C20.9089 88.4577 21.16 88.0818 21.3314 87.6682C21.5027 87.2546 21.5909 86.8113 21.5909 86.3636V20.4547Z"
        fill="#FC413D"
      />
      {/* Center envelope fold with Google yellow-red-pink gradient */}
      <path
        d="M17.7421 12.7593C13.1779 8.92291 6.36827 9.51268 2.53192 14.0769C-1.30444 18.6405 -0.714664 25.4501 3.84953 29.2871L47.0756 65.6216C47.8946 66.3101 48.9303 66.6875 50.0003 66.6875C51.0702 66.6875 52.1059 66.3101 52.925 65.6216L96.151 29.2865C100.715 25.4501 101.304 18.6405 97.468 14.0763C93.6317 9.51268 86.822 8.92291 82.2584 12.7593L50 39.8751L17.7421 12.7593Z"
        fill="url(#paint1_linear_gmail_fold)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_gmail_right"
          x1="89.2036"
          y1="20.4547"
          x2="89.2036"
          y2="89.7727"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#60D673" />
          <stop offset="0.17" stopColor="#42C868" />
          <stop offset="0.39" stopColor="#0EBC5F" />
          <stop offset="0.62" stopColor="#00A9BB" />
          <stop offset="0.86" stopColor="#3C90FF" />
          <stop offset="1" stopColor="#3186FF" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_gmail_fold"
          x1="0.000107106"
          y1="21.6649"
          x2="99.9998"
          y2="21.6649"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.08" stopColor="#FF63A0" />
          <stop offset="0.3" stopColor="#FC413D" />
          <stop offset="0.5" stopColor="#FC413D" />
          <stop offset="0.65" stopColor="#FC413D" />
          <stop offset="0.72" stopColor="#FC5C30" />
          <stop offset="0.86" stopColor="#FEB10C" />
          <stop offset="0.91" stopColor="#FEC700" />
          <stop offset="0.96" stopColor="#FFDB0F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export { GoogleGmailIcon as Gmail };
