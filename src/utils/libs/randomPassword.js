import { randomInt } from 'node:crypto';

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '@#$%&*!?';

const ALL_CHARACTERS = `${UPPERCASE}${LOWERCASE}${DIGITS}${SYMBOLS}`;

function pickRandomChar(charSet) {
  return charSet[randomInt(0, charSet.length)];
}

export function generateTemporaryPassword(length = 12) {
  const safeLength = Math.max(8, Math.min(length, 16));

  const mandatoryChars = [
    pickRandomChar(UPPERCASE),
    pickRandomChar(LOWERCASE),
    pickRandomChar(DIGITS),
    pickRandomChar(SYMBOLS),
  ];

  const remainingChars = Array.from(
    { length: safeLength - mandatoryChars.length },
    () => pickRandomChar(ALL_CHARACTERS),
  );

  const passwordChars = [...mandatoryChars, ...remainingChars];

  for (let index = passwordChars.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(0, index + 1);
    [passwordChars[index], passwordChars[randomIndex]] = [
      passwordChars[randomIndex],
      passwordChars[index],
    ];
  }

  return passwordChars.join('');
}
