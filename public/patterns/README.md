# Custom Texture Patterns / カスタムテクスチャーパターンについて

[English follows Japanese / 日本語のあとに英語の解説があります]

このディレクトリに PNG 画像ファイルを配置することで、カメラアプリのディザテクスチャーパターン（マスク）を自前のものにカスタマイズできます。

---

## 1. ファイル命名規則 (File Naming Convention)

画像ファイルの名前は、アプリ内のプリセット名（大文字）とグリッドサイズ（`8` または `16`）を組み合わせて指定します。

* **8x8 グリッド用:** `<プリセット名>_8.png` (例: `TYPE_A_8.png`)
* **16x16 グリッド用:** `<プリセット名>_16.png` (例: `TYPE_A_16.png`)

### 利用可能なプリセット名一覧
* `TYPE_A`
* `TYPE_B`
* `TYPE_C`
* `TYPE_D`
* `TYPE_E`
* `TYPE_F`
* `TYPE_G`
* `TYPE_H`
* `TYPE_I`
* `TYPE_J`
* `TYPE_K`
* `TYPE_L`
* `TYPE_M`

---

## 2. 画像の仕様とレイアウト (Image Specifications)

各画像には、**4つのトーン段階（Tone 1〜4）** を横並びにしたアトラス形式で描画します。

### ■ 8x8 グリッド (`*_8.png`)
* **画像全体のサイズ:** 横 32 × 縦 8 ピクセル
* **レイアウト:** 8x8 ピクセルの正方形が横に4つ並ぶ構成になります。
  `[ Tone 1 (8x8) ][ Tone 2 (8x8) ][ Tone 3 (8x8) ][ Tone 4 (8x8) ]`
  * X座標: 0〜7 ＝ Tone 1 (最も暗いトーン)
  * X座標: 8〜15 ＝ Tone 2
  * X座標: 16〜23 ＝ Tone 3
  * X座標: 24〜31 ＝ Tone 4 (最も明るいトーン)

### ■ 16x16 グリッド (`*_16.png`)
* **画像全体のサイズ:** 横 64 × 縦 16 ピクセル
* **レイアウト:** 16x16 ピクセルの正方形が横に4つ並ぶ構成になります。
  `[ Tone 1 (16x16) ][ Tone 2 (16x16) ][ Tone 3 (16x16) ][ Tone 4 (16x16) ]`
  * X座標: 0〜15 ＝ Tone 1 (最も暗いトーン)
  * X座標: 16〜31 ＝ Tone 2
  * X座標: 32〜47 ＝ Tone 3
  * X座標: 48〜63 ＝ Tone 4 (最も明るいトーン)

---

## 3. カラーとパターンの反映ルール (Color Rules)
* ピクセルの**輝度が 127 より大きい**場合（例：白色 `#FFFFFF`）: **1**（ドットを描画する）として判定されます。
* ピクセルの**輝度が 127 以下**の場合（例：黒色 `#000000`）: **0**（ドットを描画しない/透過）として判定されます。
* 基本的には単純な「白」と「黒」の2色で画像を作成してください。

---
---

# English Description

You can customize the dither texture patterns used by the camera by placing PNG image files in this directory.

## 1. File Naming Convention

Name your files matching the preset name in the app (uppercase) followed by the grid size:
* `<PRESET_NAME>_8.png` (for 8x8 grids, e.g., `TYPE_A_8.png`)
* `<PRESET_NAME>_16.png` (for 16x16 grids, e.g., `TYPE_A_16.png`)

Available preset names:
* `TYPE_A`, `TYPE_B`, `TYPE_C`, `TYPE_D`, `TYPE_E`, `TYPE_F`, `TYPE_G`, `TYPE_H`, `TYPE_I`, `TYPE_J`, `TYPE_K`, `TYPE_L`, `TYPE_M`

## 2. Image Specifications

Each image contains all **4 tone levels** arranged side-by-side horizontally.

### ■ 8x8 Grid (`*_8.png`)
* **Total Image Size:** 32 × 8 pixels
* **Layout:** Four 8x8 pixel squares side-by-side:
  `[ Tone 1 (8x8) ][ Tone 2 (8x8) ][ Tone 3 (8x8) ][ Tone 4 (8x8) ]`
  (X: 0-7 = Tone 1, X: 8-15 = Tone 2, X: 16-23 = Tone 3, X: 24-31 = Tone 4)

### ■ 16x16 Grid (`*_16.png`)
* **Total Image Size:** 64 × 16 pixels
* **Layout:** Four 16x16 pixel squares side-by-side:
  `[ Tone 1 (16x16) ][ Tone 2 (16x16) ][ Tone 3 (16x16) ][ Tone 4 (16x16) ]`
  (X: 0-15 = Tone 1, X: 16-31 = Tone 2, X: 32-47 = Tone 3, X: 48-63 = Tone 4)

## 3. Color Rules
* Pixels with **brightness > 127** (e.g., white `#FFFFFF`) are treated as **1** (active/draw).
* Pixels with **brightness <= 127** (e.g., black `#000000`) are treated as **0** (inactive/empty).
* We recommend using simple pure black and white images.
