# karsh-csv

Küçük bir RFC 4180 CSV okuyucusu ve yazıcısı. Asıl farkı ayraç sezgisinde:
eşitlik çıktığında `;` kazanır, çünkü Türkçe yerel ayarlı Excel dosyayı öyle
kaydeder.

A small RFC 4180 CSV reader and writer. The difference is in the delimiter
guess: a tie goes to `;`, because that is how Excel in a Turkish locale saves
the file.

120 satır · sıfır bağımlılık · DOM yok · MIT
120 lines · zero dependencies · no DOM · MIT

---

## Türkçe

### Ne işe yarar

Bir CSV dosyasını satır dizisine çevirir ve geri yazar. Kapsamı bilerek dar:
gerçekte başa bela olan üç şeyi çözer.

- **Ayraç.** Türkçe yerel ayarlı Excel `;` ile kaydeder, çünkü virgül ondalık
  ayracıdır. Dosyanın ilk on dolu satırına bakılır ve satırları en tutarlı
  bölen ayraç seçilir; iki aday eşit çıkarsa `;` kazanır — Türkçe bir Excel
  dışa aktarımı, virgülle dolu bir URL sütunundan daha olası.
- **BOM.** UTF-8 BOM'uyla gelen dosyanın ilk sütun adı artık `ad` değildir:
  başına görünmez bir BOM karakteri gelmiştir ve hiçbir eşleşme tutmaz.
  Okuyucu BOM'u sessizce atar.
- **Tırnak.** Tırnaklı bir alan ayracı, ikilenmiş tırnağı ve satır sonunu
  içinde taşıyabilir.

Tür çıkarımı, akış (streaming), yorum satırı yok — bir bağlantı ya da barkod
listesinin ihtiyacı değil.

### Kurulum

Paket TypeScript kaynağı olarak dağıtılır; derleme adımı yoktur.

```bash
npm i github:<kullanıcı>/karsh-csv
```

Kaynak TypeScript olduğu için tüketen tarafın TS'i çözebilmesi gerekir:
Vite, esbuild, webpack ya da Next gibi bir paketleyici. Next'te ayrıca
`next.config` dosyana `transpilePackages: ["karsh-csv"]` eklemen gerekir: Next
`node_modules` içindeki ham TypeScript'i kendiliğinden derlemez. Düz `node`
paketi olduğu gibi çalıştıramaz.

Ya da `src/csv.ts` dosyasını projene kopyala: tek dosya, sıfır bağımlılık,
lisansı MIT.

### Kullanım

Ayracı söylemeden okumak:

```ts
import { parseCsv } from "karsh-csv";

const table = parseCsv('ad;fiyat\r\n"Kalem, mavi";12,50\r\n');

table.delimiter; // ";"
table.rows;      // [["ad", "fiyat"], ["Kalem, mavi", "12,50"]]
```

Eşitlikte `;` kazanıyor — asıl fark bu:

```ts
import { detectDelimiter } from "karsh-csv";

detectDelimiter("ad;fiyat,kdv\nKalem;12,20"); // ";" — iki aday da tutarlı, `;` önde
detectDelimiter("a,b,c\nd,e,f");              // ","
```

Yazarken tırnak yalnızca gerektiğinde konur:

```ts
import { toCsv, csvCell } from "karsh-csv";

toCsv(
  [
    ["ad", "not"],
    ["Kalem", 'mavi "ince"'],
  ],
  ";",
);
```

Çıktı (satır sonları CRLF, RFC 4180'in istediği gibi):

```csv
ad;not
Kalem;"mavi ""ince"""
```

```ts
csvCell("Kalem, mavi", ",");  // '"Kalem, mavi"' — virgül ayraç, tırnaklanır
csvCell("Kalem, mavi", ";");  // 'Kalem, mavi'   — virgül veri, dokunulmaz
```

### API

| Dışa aktarım | İmza | Ne yapar |
| --- | --- | --- |
| `parseCsv` | `(input: string, delimiter?: CsvDelimiter) => CsvTable` | BOM'u atar, ayracı verilmediyse kendi bulur, tırnaklı alanları çözer, sondaki boş satırları düşürür |
| `detectDelimiter` | `(text: string) => CsvDelimiter` | İlk on dolu satırı en tutarlı bölen ayraç; eşitlikte `;` |
| `toCsv` | `(rows: string[][], delimiter?: CsvDelimiter) => string` | Satırları CRLF ile birleştirir; varsayılan ayraç `,` |
| `csvCell` | `(value: string, delimiter?: CsvDelimiter) => string` | Tek bir değeri, yalnızca gerekiyorsa tırnaklar |
| `CsvTable` | `{ delimiter: CsvDelimiter; rows: string[][] }` | Okunan tablo; başlık satırı `rows[0]`, ayrı tutulmaz |
| `CsvDelimiter` | tip | Virgül, noktalı virgül ya da sekme |

Bilinmesi gerekenler:

- Başlık satırı ayrılmaz; `rows[0]` başlıktır, karar çağırana aittir.
- Bir tırnak ancak alanın **ilk** karakteriyse alanı açar. `12"lik` gibi bir
  değer olduğu gibi okunur — Excel de öyle yapıyor.
- Satır sonu CR, LF ya da CRLF olabilir; yazarken hep CRLF üretilir.
- Sondaki tamamen boş satırlar atılır, aradakiler korunur.

### Neden kütüphane değil, elle yazıldı

Hazır CSV paketleri büyük, çünkü genel: tür çıkarımı, akış, yorum satırları,
esnek şemalar. Burada gereken bunların hiçbiri değildi — gereken şey, bir
kullanıcının Excel'den dışa aktarıp yapıştırdığı dosyanın açılmasıydı. Ve o
dosyada başa bela olan tek şey, hiçbir genel paketin varsayılanında
bulunmayan bir tercih: eşitlikte `;`.

Yüz yirmi satır okunabilir, tamamı test edilebilir ve davranışı bizim
kararımız. Bir bağımlılıkta aynı tercihi elde etmek için yapılandırma
yazmak, sonra o yapılandırmanın sürüm sürüm kaymasını izlemek gerekirdi.

### Lisans

MIT — bkz. [LICENSE](LICENSE). © 2026 Hasan Karşı / KARSH.

---

## English

### What it does

Turns a CSV file into rows and writes them back. The scope is deliberately
narrow: it solves the three things that actually go wrong.

- **The delimiter.** Excel in a Turkish locale saves with `;`, because the
  comma is the decimal separator. The reader looks at the first ten non-empty
  lines and picks the delimiter that splits them most consistently; when two
  candidates tie, `;` wins — a Turkish Excel export is the likelier file, and
  a URL column full of commas is not.
- **The BOM.** With a UTF-8 BOM the first header is no longer `ad`: an
  invisible BOM character sits in front of it, and no lookup ever matches.
  The reader drops it silently.
- **Quotes.** A quoted field may hold the delimiter, a doubled quote or a
  line break.

No type inference, no streaming, no comment lines — none of which a list of
links or barcodes needs.

### Install

The package ships as TypeScript source; there is no build step.

```bash
npm i github:<user>/karsh-csv
```

Because it ships as TypeScript, whatever consumes it has to resolve TS: a
bundler such as Vite, esbuild, webpack or Next. On Next you also need
`transpilePackages: ["karsh-csv"]` in your `next.config`: Next does not compile raw
TypeScript inside `node_modules` on its own. Plain `node` cannot run the
package as it ships.

Or copy `src/csv.ts` into your project — one file, no imports, MIT.

### Usage

Reading without naming the delimiter:

```ts
import { parseCsv } from "karsh-csv";

const table = parseCsv('ad;fiyat\r\n"Kalem, mavi";12,50\r\n');

table.delimiter; // ";"
table.rows;      // [["ad", "fiyat"], ["Kalem, mavi", "12,50"]]
```

The tie going to `;` is the whole point:

```ts
import { detectDelimiter } from "karsh-csv";

detectDelimiter("ad;fiyat,kdv\nKalem;12,20"); // ";" — both are consistent, `;` wins
detectDelimiter("a,b,c\nd,e,f");              // ","
```

Writing quotes a value only when it has to:

```ts
import { toCsv, csvCell } from "karsh-csv";

toCsv(
  [
    ["ad", "not"],
    ["Kalem", 'mavi "ince"'],
  ],
  ";",
);
```

Output (CRLF line endings, as RFC 4180 asks):

```csv
ad;not
Kalem;"mavi ""ince"""
```

```ts
csvCell("Kalem, mavi", ",");  // '"Kalem, mavi"' — the comma is the delimiter
csvCell("Kalem, mavi", ";");  // 'Kalem, mavi'   — the comma is just data
```

### API

| Export | Signature | What it does |
| --- | --- | --- |
| `parseCsv` | `(input: string, delimiter?: CsvDelimiter) => CsvTable` | Drops the BOM, guesses the delimiter when none is given, unquotes fields, removes trailing blank rows |
| `detectDelimiter` | `(text: string) => CsvDelimiter` | The delimiter that splits the first ten non-empty lines most consistently; a tie goes to `;` |
| `toCsv` | `(rows: string[][], delimiter?: CsvDelimiter) => string` | Joins rows with CRLF; the delimiter defaults to `,` |
| `csvCell` | `(value: string, delimiter?: CsvDelimiter) => string` | Quotes a single value, and only when it has to be quoted |
| `CsvTable` | `{ delimiter: CsvDelimiter; rows: string[][] }` | The table as read; the header is `rows[0]`, not held apart |
| `CsvDelimiter` | type | Comma, semicolon or tab |

Worth knowing:

- The header row is not separated out. `rows[0]` is the header, and what to do
  with it is the caller's decision.
- A quote opens a field only when it is the **first** character of that field.
  A value like `12"lik` is read as written — which is what Excel does too.
- Line endings may be CR, LF or CRLF on the way in; CRLF is always written on
  the way out.
- Trailing all-blank rows are dropped; blank rows in the middle are kept.

### Why this was written rather than installed

The CSV packages are large because they are general: type inference,
streaming, comment lines, flexible schemas. None of that was needed here.
What was needed was that the file a user exported from Excel and pasted in
would open — and the one thing that actually broke it is a preference no
general package ships by default: on a tie, `;`.

A hundred and twenty lines can be read end to end, tested end to end, and the
behaviour is our decision. Getting the same preference out of a dependency
would mean writing configuration, and then watching that configuration drift
from release to release.

### License

MIT — see [LICENSE](LICENSE). © 2026 Hasan Karşı / KARSH.
