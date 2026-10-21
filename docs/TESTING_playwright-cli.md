# Testing the new lesson screens with playwright-cli

These checks use Microsoft's playwright-cli (https://github.com/microsoft/playwright-cli). The automated runs for this update used the same Playwright engine inside Claude's sandbox, which has no internet to install the CLI itself.

## Install once

```
npm install -g @playwright/cli@latest
playwright-cli --help
```

## Check a canvas lesson (the design reference)

Open a lesson from the shared canvas link, play one question, and save screenshots before and after Check:

```
playwright-cli open "<your canvas share link>" --device="iPhone 15" --headed
playwright-cli snapshot                    # lists the buttons with refs such as e21
playwright-cli click e21                   # pick an answer (use the ref from the snapshot)
playwright-cli click "getByRole('button', { name: 'Check' })"
playwright-cli screenshot --filename=after-check.png
playwright-cli console error               # should list nothing
```

## What to look for on each new lesson

1. The picture moves before Check (belt scrolling, heart trace, pointer wobble, drops falling).
2. On a right answer it acts the answer out (fruit dropping in the bin, current flowing, syringe filling, bars flashing).
3. A wrong answer gives a short shake and "Not quite".
4. The hint, the "What it does" note and the field note open and close, and none of them gives the answer away.
5. With Reduce Motion on (iPhone Settings, Accessibility, Motion), everything stays still.

## The app itself

Test the app on a phone with Expo Go: `npx expo start --lan --clear`, then scan the QR code (use Personal Hotspot on campus).
Pick Engineering + Python, Healthcare + Python or Healthcare + R in onboarding to reach the new tracks.
