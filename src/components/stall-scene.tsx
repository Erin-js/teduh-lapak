export function BrandMark() {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true">
      <path
        d="M7 20 14 8h16l7 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M7 20h30v3a5 5 0 0 1-10 0 5 5 0 0 1-10 0 5 5 0 0 1-10 0v-3Z"
        fill="currentColor"
      />
      <path
        d="M11 29v9h22v-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path d="M20 8v10M27 8v10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function StallScene({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={`stall-scene ${small ? "small" : ""}`}
      viewBox="0 0 640 500"
      role="img"
      aria-label="Ilustrasi konsep lapak dengan peneduh, air minum, bangku, dan pohon pelindung"
    >
      <defs>
        <linearGradient id="scene-ground" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#e3ddc4" />
          <stop offset="1" stopColor="#f0ead9" />
        </linearGradient>
        <linearGradient id="scene-sun" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#f2b635" />
          <stop offset="1" stopColor="#e45c10" />
        </linearGradient>
        <linearGradient id="scene-roof" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#6e8035" />
          <stop offset="1" stopColor="#4b5d16" />
        </linearGradient>
        <pattern
          id="scene-paving"
          width="50"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 24h50M25 0v24"
            stroke="#c7c6aa"
            strokeWidth=".7"
            opacity=".45"
          />
        </pattern>
      </defs>
      <path
        d="M104 137C108 45 224 39 327 42c116-4 229 66 239 177s-23 205-134 225c-132 25-316 3-344-93-23-79-16-139 16-214Z"
        fill="#e8e4cf"
      />
      <g className="scene-sun">
        <circle cx="451" cy="107" r="49" fill="url(#scene-sun)" />
        <g stroke="#dc8b1c" strokeWidth="2" strokeLinecap="round">
          <path d="M451 42V31M451 183v-11M386 107h-11M528 107h-12M405 60l-9-8M497 155l9 8M405 155l-9 8M497 60l9-8" />
        </g>
      </g>
      <g fill="#dddac6" opacity=".75">
        <path d="M90 278V161h42v117M139 278V190h42v88M187 278V144h53v134M249 278V175h40v103M480 278V186h39v92M525 278V163h37v115" />
        <path d="M204 144v-16h17v16M539 163v-16h10v16" />
      </g>
      <path d="M66 385 327 291l268 108-261 84Z" fill="url(#scene-ground)" />
      <path d="M66 385 327 291l268 108-261 84Z" fill="url(#scene-paving)" />
      <ellipse
        cx="320"
        cy="403"
        rx="164"
        ry="28"
        fill="#8d9267"
        opacity=".15"
      />
      <g className="scene-tree">
        <path
          d="M128 370V211M128 286l-28-30M128 256l31-36"
          fill="none"
          stroke="#606a2c"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M127 116c-27-36-68-11-67 17-37 5-47 51-17 71-6 37 34 56 59 36 12 30 64 24 72-7 38-4 43-55 13-71 9-35-26-65-60-46Z"
          fill="#4b5d16"
        />
        <path
          d="M129 136c-9-15-32-10-40 4-21-1-32 20-24 36-18 27 13 48 34 33 20 23 56 9 55-13 27-9 24-38 3-46-3-10-17-17-28-14Z"
          fill="#687b2f"
        />
        <path
          d="M81 159c7-13 19-11 27-7M146 186c11 2 15-6 16-12"
          fill="none"
          stroke="#94a15e"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <ellipse cx="128" cy="374" rx="30" ry="11" fill="#a9b078" />
      </g>
      <g stroke="#35451d" strokeLinejoin="round">
        <path d="M207 231v151M429 231v151" strokeWidth="6" />
        <path
          d="m181 225 39-76h188l46 76Z"
          fill="url(#scene-roof)"
          strokeWidth="2"
        />
        <path
          d="m220 149-7 76M257 149l-3 76M294 149v76M331 149l4 76M368 149l10 76M408 149l19 76"
          stroke="#b6bd86"
          strokeWidth="1.6"
          opacity=".6"
        />
        <path
          d="M181 225h273v13c0 18-34 18-34 0 0 18-34 18-34 0 0 18-34 18-34 0 0 18-35 18-35 0 0 18-34 18-34 0 0 18-34 18-34 0 0 18-34 18-34 0 0 18-34 18-34 0Z"
          fill="#f4edcf"
          strokeWidth="1.8"
        />
        <path
          d="M215 225h34v13c0 18-34 18-34 0ZM283 225h34v13c0 18-34 18-34 0ZM352 225h34v13c0 18-34 18-34 0ZM420 225h34v13c0 18-34 18-34 0Z"
          fill="#4b5d16"
          stroke="none"
        />
      </g>
      <g>
        <path
          d="M220 307h155v84H220Z"
          fill="#e4a82d"
          stroke="#6f6b30"
          strokeWidth="2"
        />
        <path
          d="m375 307 25-11v84l-25 11Z"
          fill="#b58323"
          stroke="#6f6b30"
          strokeWidth="2"
        />
        <rect
          x="213"
          y="300"
          width="171"
          height="12"
          rx="4"
          fill="#f6f4e9"
          stroke="#6f6b30"
          strokeWidth="2"
        />
        <path d="m384 300 23-10-7 6-25 11" fill="#d4ceb3" />
        <rect x="235" y="327" width="127" height="45" rx="4" fill="#f6f0db" />
        <text
          x="298"
          y="346"
          textAnchor="middle"
          fill="#3c4c19"
          fontFamily="var(--font-display), sans-serif"
          fontSize="16"
          fontWeight="800"
        >
          TEDUH LAPAK
        </text>
        <text
          x="298"
          y="360"
          textAnchor="middle"
          fill="#6b7351"
          fontFamily="sans-serif"
          fontSize="7"
          letterSpacing="2"
        >
          RUANG TEDUH BERSAMA
        </text>
        <circle cx="243" cy="395" r="11" fill="#35451d" />
        <circle cx="243" cy="395" r="4" fill="#ece2ce" />
        <circle cx="358" cy="395" r="11" fill="#35451d" />
        <circle cx="358" cy="395" r="4" fill="#ece2ce" />
        <path
          d="M243 298v-36h42v36"
          fill="#f2f0de"
          stroke="#6b7351"
          strokeWidth="2"
        />
        <path d="M243 272h42" stroke="#6b7351" strokeWidth="2" />
        <path d="M255 270v-6M272 270v-6" stroke="#dfaa32" strokeWidth="3" />
        <ellipse cx="324" cy="290" rx="23" ry="9" fill="#c28235" />
        <ellipse cx="324" cy="286" rx="23" ry="9" fill="#f1ddb0" />
        <g fill="#6b8039">
          <circle cx="314" cy="284" r="4" />
          <circle cx="322" cy="280" r="5" />
          <circle cx="333" cy="284" r="5" />
        </g>
      </g>
      <g className="scene-person">
        <path d="M353 300v-30c0-13 32-13 32 0v30" fill="#e6e8cc" />
        <path d="M359 277v22h21v-22" fill="#647a32" />
        <path d="M362 261v-10h14v10" fill="#bf8c61" />
        <ellipse cx="369" cy="241" rx="14" ry="17" fill="#d4a073" />
        <path
          d="M355 239c-5-24 30-23 28-4l-5-1c-4-2-10-2-12-8l-5 13Z"
          fill="#303b20"
        />
        <path
          d="m355 273-11 17-14-2"
          fill="none"
          stroke="#d4a073"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M381 273v18"
          stroke="#d4a073"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </g>
      <g>
        <path d="M454 366h73v10h-73Z" fill="#8c6638" />
        <path d="M462 376v26M518 376v26" stroke="#52602a" strokeWidth="5" />
        <path d="M459 348h64v14h-64Z" fill="#bc9459" />
        <path d="M464 348v20M517 348v20" stroke="#52602a" strokeWidth="4" />
        <path d="M465 349h52" stroke="#805b30" strokeWidth="1.5" />
        <rect
          x="466"
          y="306"
          width="27"
          height="34"
          rx="7"
          fill="#dde5d9"
          stroke="#718578"
          strokeWidth="2"
        />
        <path d="M468 321h23v12c0 7-23 7-23 0Z" fill="#a9c5b8" />
        <rect x="473" y="302" width="13" height="6" rx="2" fill="#647d6d" />
        <rect
          x="461"
          y="339"
          width="37"
          height="9"
          rx="2"
          fill="#f4f0e2"
          stroke="#6b7351"
          strokeWidth="1.5"
        />
        <path d="M467 348v17M493 348v17" stroke="#6b7351" strokeWidth="3" />
      </g>
      <g fill="#687e35">
        <path d="M173 395c-22-35-20-49-4-42 10 9 9 24 4 42Z" />
        <path d="M174 396c-2-36 18-50 23-32 1 15-10 25-23 32Z" />
        <path d="M172 393c-25-7-29-22-15-24 12 3 15 13 15 24Z" />
      </g>
      <path d="M155 391h39l-7 25h-24Z" fill="#c97d45" />
      <path
        d="M209 431h65M431 429h28M101 407h20"
        stroke="#b5b798"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g
        className="scene-bird"
        stroke="#7b8558"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M269 89q8-10 16 0 8-10 16 0M313 69q6-8 12 0 6-8 12 0" />
      </g>
    </svg>
  );
}
