/* Дополнение к курсу: модуль «Алгоритмы» (8 уроков), квиз и справочник.
   Подключается после data.js и вставляет модуль перед «Структуры и дальше». */
(function () {
const D = window.DATA; if (!D) return;
const R = String.raw;
const MAINV = R`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // пиши код здесь

    return 0;
}
`;

const mod = { id: 'm8', title: 'Алгоритмы', color: '#7ee0c3', lessons: [

{ id: 'l25', title: 'Счётчики и частоты', xp: 30,
theory: R`
Часто нужно посчитать, сколько раз встречается каждый символ или число. Для этого заводят массив-счётчик: индекс — это «что считаем», значение — «сколько раз».

@@run
#include <iostream>
#include <string>
using namespace std;

int main() {
    string s = "banana";
    int cnt[26] = {0};            // 26 букв, все счётчики по нулям
    for (char c : s) cnt[c - 'a']++;   // 'a' -> 0, 'b' -> 1, ...
    for (int i = 0; i < 26; i++)
        if (cnt[i] > 0) cout << char('a' + i) << ": " << cnt[i] << endl;
    return 0;
}
@@

- ‹c - 'a'› превращает букву в номер от 0 до 25.
- ‹char('a' + i)› делает обратное: номер → буква.
- Тот же приём работает для цифр (‹c - '0'›) и для небольших чисел: ‹cnt[x]++›.
`,
task: R`Прочитай строку из маленьких латинских букв. Для каждой буквы, которая встречается, выведи строку «буква: количество» в алфавитном порядке.

Пример:
Ввод: banana
Вывод:
a: 3
b: 1
n: 2`,
starter: R`#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    // заведи int cnt[26] и пройди по строке

    return 0;
}
`,
tests: [{ in: 'banana', out: 'a: 3\nb: 1\nn: 2' }, { in: 'hello', out: 'e: 1\nh: 1\nl: 2\no: 1' }, { in: 'zzz', out: 'z: 3' }],
hint: 'cnt[c - \'a\']++ для каждого символа, затем цикл по i от 0 до 25 и вывод char(\'a\' + i) << ": " << cnt[i], если cnt[i] > 0.',
solution: R`#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    int cnt[26] = {0};
    for (char c : s) cnt[c - 'a']++;
    for (int i = 0; i < 26; i++)
        if (cnt[i] > 0) cout << char('a' + i) << ": " << cnt[i] << endl;
    return 0;
}
` },

{ id: 'l26', title: 'Линейный поиск', xp: 30,
theory: R`
Самый простой поиск: идём по элементам слева направо и останавливаемся, как только нашли нужный.

@@run
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> v = {4, 9, 2, 9};
    int x = 9, pos = -1;          // -1 = «не найдено»
    for (int i = 0; i < (int)v.size(); i++) {
        if (v[i] == x) { pos = i; break; }
    }
    cout << pos << endl;          // 1
    return 0;
}
@@

- Заранее выбери значение «не найдено» — обычно ‹-1›, ведь такого индекса не бывает.
- ‹break› останавливает поиск на первом совпадении. Без него в ‹pos› осталось бы последнее.
- Скорость: в худшем случае проверяются все ‹n› элементов.
`,
task: R`Прочитай n, затем n целых чисел, затем число x. Выведи индекс (с нуля) первого элемента, равного x, или -1, если такого нет.

Пример:
Ввод:
5
3 8 1 8 2
8
Вывод: 1`,
starter: MAINV,
tests: [{ in: '5\n3 8 1 8 2\n8', out: '1' }, { in: '3\n1 2 3\n7', out: '-1' }, { in: '1\n5\n5', out: '0' }, { in: '4\n7 7 7 7\n7', out: '0' }],
hint: 'Прочитай вектор, потом x. Заведи int pos = -1 и в цикле при v[i] == x запиши pos = i и сделай break.',
solution: R`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    int x, pos = -1;
    cin >> x;
    for (int i = 0; i < n; i++) {
        if (v[i] == x) { pos = i; break; }
    }
    cout << pos << endl;
    return 0;
}
` },

{ id: 'l27', title: 'Префиксные суммы', xp: 35,
theory: R`
Если нужно много раз узнавать сумму на отрезке, не считай её заново. Один раз посчитай **префиксные суммы**: ‹pre[i]› — сумма первых ‹i› элементов.

@@run
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> a = {2, 5, 1, 4};
    vector<long long> pre(a.size() + 1, 0);
    for (int i = 0; i < (int)a.size(); i++) pre[i + 1] = pre[i] + a[i];
    // сумма a[l..r] (нумерация с 1) = pre[r] - pre[l - 1]
    cout << pre[3] - pre[1] << endl;   // 5 + 1 = 6
    return 0;
}
@@

- Массив ‹pre› на один элемент длиннее, а ‹pre[0] = 0›.
- Любой запрос теперь стоит одно вычитание, вместо цикла.
- Для больших сумм бери ‹long long›.
`,
task: R`Прочитай n и n чисел, затем q и q запросов «l r» (номера с 1, включительно). На каждый запрос выведи сумму элементов с l по r на отдельной строке.

Пример:
Ввод:
5
1 2 3 4 5
3
1 5
2 3
4 4
Вывод:
15
5
4`,
starter: MAINV,
tests: [{ in: '5\n1 2 3 4 5\n3\n1 5\n2 3\n4 4', out: '15\n5\n4' }, { in: '3\n-10 5 7\n2\n1 1\n1 3', out: '-10\n2' }, { in: '1\n9\n1\n1 1', out: '9' }],
hint: 'pre[i + 1] = pre[i] + a[i]. Ответ на запрос: pre[r] - pre[l - 1].',
solution: R`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> pre(n + 1, 0);
    for (int i = 1; i <= n; i++) {
        long long x;
        cin >> x;
        pre[i] = pre[i - 1] + x;
    }
    int q;
    cin >> q;
    while (q--) {
        int l, r;
        cin >> l >> r;
        cout << pre[r] - pre[l - 1] << endl;
    }
    return 0;
}
` },

{ id: 'l28', title: 'Двоичный поиск', xp: 40,
theory: R`
Если массив **отсортирован**, искать можно намного быстрее: смотрим на середину и отбрасываем половину, где искомого точно нет. Для миллиона элементов хватит около 20 шагов вместо миллиона.

@@run
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> v = {1, 3, 5, 7, 9, 11};
    int x = 7, lo = 0, hi = (int)v.size() - 1, pos = -1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (v[mid] == x) { pos = mid; break; }
        if (v[mid] < x) lo = mid + 1;   // ищем справа
        else hi = mid - 1;              // ищем слева
    }
    cout << pos << endl;                // 3
    return 0;
}
@@

- ‹lo› и ‹hi› — границы, где ещё может быть ответ. Цикл идёт, пока ‹lo <= hi›.
- Сдвигай границу на ‹mid + 1› или ‹mid - 1›, иначе возможен вечный цикл.
- В стандартной библиотеке есть ‹binary_search›, ‹lower_bound› и ‹upper_bound›, но суть полезно понимать.
`,
task: R`Прочитай n, затем n чисел в порядке возрастания, затем x. Напиши двоичный поиск и выведи индекс (с нуля) числа x или -1, если его нет.

Пример:
Ввод:
5
1 3 5 7 9
7
Вывод: 3`,
starter: MAINV,
tests: [{ in: '5\n1 3 5 7 9\n7', out: '3' }, { in: '5\n1 3 5 7 9\n4', out: '-1' }, { in: '1\n2\n2', out: '0' }, { in: '6\n1 2 3 4 5 6\n1', out: '0' }, { in: '6\n1 2 3 4 5 6\n6', out: '5' }],
hint: 'lo = 0, hi = n - 1; пока lo <= hi: mid = (lo + hi) / 2; сравни v[mid] с x и подвинь lo или hi.',
solution: R`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    int x;
    cin >> x;
    int lo = 0, hi = n - 1, pos = -1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (v[mid] == x) { pos = mid; break; }
        if (v[mid] < x) lo = mid + 1;
        else hi = mid - 1;
    }
    cout << pos << endl;
    return 0;
}
` },

{ id: 'l29', title: 'НОД и алгоритм Евклида', xp: 35,
theory: R`
**НОД** — наибольший общий делитель. Древний алгоритм Евклида: заменяем пару ‹(a, b)› на ‹(b, a % b)›, пока ‹b› не станет нулём. Тогда ответ — ‹a›.

@@run
#include <iostream>
using namespace std;

long long gcdf(long long a, long long b) {
    while (b != 0) {
        long long t = a % b;
        a = b;
        b = t;
    }
    return a;
}

int main() {
    cout << gcdf(12, 18) << endl;   // 6
    return 0;
}
@@

- Рекурсивный вариант короче: ‹return b == 0 ? a : gcdf(b, a % b);›
- **НОК** (наименьшее общее кратное) выражается через НОД: ‹a / gcd * b›. Сначала дели, чтобы число не переполнилось.
`,
task: R`Прочитай два положительных целых числа a и b. Выведи через пробел их НОД и НОК.

Пример:
Ввод: 12 18
Вывод: 6 36`,
starter: R`#include <iostream>
using namespace std;

long long gcdf(long long a, long long b) {
    // алгоритм Евклида
}

int main() {
    long long a, b;
    cin >> a >> b;
    // выведи НОД и НОК

    return 0;
}
`,
tests: [{ in: '12 18', out: '6 36' }, { in: '7 13', out: '1 91' }, { in: '100 25', out: '25 100' }, { in: '1000000 999999', out: '1 999999000000' }],
hint: 'Пока b != 0: t = a % b; a = b; b = t. НОК = a / g * b, где g — найденный НОД.',
solution: R`#include <iostream>
using namespace std;

long long gcdf(long long a, long long b) {
    while (b != 0) {
        long long t = a % b;
        a = b;
        b = t;
    }
    return a;
}

int main() {
    long long a, b;
    cin >> a >> b;
    long long g = gcdf(a, b);
    cout << g << " " << a / g * b << endl;
    return 0;
}
` },

{ id: 'l30', title: 'Решето Эратосфена', xp: 40,
theory: R`
Как быстро найти все простые числа до ‹n›? Выпиши числа от 2 до ‹n›. Возьми первое непомеченное (оно простое) и вычеркни все его кратные. Повторяй.

@@run
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n = 30;
    vector<bool> comp(n + 1, false);   // comp[i] = true, если i составное
    for (int i = 2; i * i <= n; i++) {
        if (!comp[i])
            for (int j = i * i; j <= n; j += i) comp[j] = true;
    }
    for (int i = 2; i <= n; i++) if (!comp[i]) cout << i << " ";
    cout << endl;
    return 0;
}
@@

- Внешний цикл достаточно вести до ‹i * i <= n›: у составного числа есть делитель не больше корня.
- Вычёркивать можно с ‹j = i * i›: меньшие кратные уже вычеркнуты меньшими простыми.
- Это намного быстрее, чем проверять каждое число делением.
`,
task: R`Прочитай n. Выведи, сколько простых чисел от 1 до n включительно.

Пример:
Ввод: 10
Вывод: 4
(простые: 2, 3, 5, 7)`,
starter: MAINV,
tests: [{ in: '10', out: '4' }, { in: '1', out: '0' }, { in: '2', out: '1' }, { in: '100', out: '25' }, { in: '1000', out: '168' }],
hint: 'Заведи vector<bool> comp(n + 1, false), вычеркни кратные для каждого простого i, затем сосчитай i от 2 до n с !comp[i].',
solution: R`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<bool> comp(n + 1, false);
    for (int i = 2; i * i <= n; i++) {
        if (!comp[i])
            for (int j = i * i; j <= n; j += i) comp[j] = true;
    }
    int cnt = 0;
    for (int i = 2; i <= n; i++) if (!comp[i]) cnt++;
    cout << cnt << endl;
    return 0;
}
` },

{ id: 'l31', title: 'Пузырьковая сортировка', xp: 40,
theory: R`
Функция ‹sort› удобна, но полезно уметь сортировать самому. В пузырьковой сортировке соседние элементы сравниваются и, если стоят неправильно, меняются местами. Самые большие «всплывают» в конец.

@@run
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> v = {5, 2, 9, 1};
    int n = v.size();
    for (int pass = 0; pass < n - 1; pass++) {
        for (int i = 0; i + 1 < n - pass; i++) {
            if (v[i] > v[i + 1]) swap(v[i], v[i + 1]);
        }
    }
    for (int x : v) cout << x << " ";   // 1 2 5 9
    cout << endl;
    return 0;
}
@@

- После первого прохода максимум стоит на последнем месте, после второго — второй по величине, и так далее. Поэтому внутренний цикл с каждым проходом короче.
- ‹swap(a, b)› меняет значения местами.
- Скорость: порядка ‹n²› сравнений. Для больших массивов используй ‹sort›.
`,
task: R`Прочитай n и n целых чисел. Отсортируй их по возрастанию **без** функции ‹sort› (пузырьком) и выведи через пробел.

Пример:
Ввод:
5
5 2 9 1 5
Вывод: 1 2 5 5 9`,
starter: MAINV,
tests: [{ in: '5\n5 2 9 1 5', out: '1 2 5 5 9' }, { in: '1\n7', out: '7' }, { in: '4\n-1 -5 3 0', out: '-5 -1 0 3' }, { in: '3\n1 2 3', out: '1 2 3' }],
hint: 'Два вложенных цикла: если v[i] > v[i + 1], поменяй их через swap. Числа выводи через пробел, без пробела в конце можно не заботиться — концевые пробелы игнорируются.',
solution: R`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    for (int pass = 0; pass < n - 1; pass++) {
        for (int i = 0; i + 1 < n - pass; i++) {
            if (v[i] > v[i + 1]) swap(v[i], v[i + 1]);
        }
    }
    for (int i = 0; i < n; i++) cout << v[i] << " ";
    cout << endl;
    return 0;
}
` },

{ id: 'l32', title: 'Лямбды и своя сортировка', xp: 40,
theory: R`
Третьим аргументом ‹sort› принимает **правило сравнения**: функцию, которая отвечает «должен ли ‹a› стоять раньше ‹b›». Удобно записать её на месте как **лямбду**.

@@run
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> v = {5, 2, 9, 1};
    sort(v.begin(), v.end(), [](int a, int b) {
        return a > b;                  // по убыванию
    });
    for (int x : v) cout << x << " ";  // 9 5 2 1
    cout << endl;
    return 0;
}
@@

- Запись ‹[](int a, int b) { ... }› — функция без имени.
- Правило должно быть строгим: ‹<› или ‹>›, но не ‹<=›.
- Условие сложнее одного сравнения пишется через ‹if›: сначала главный признак, при равенстве — запасной.
`,
task: R`Прочитай n и n целых чисел. Отсортируй их по возрастанию модуля. Если модули равны, меньшее число должно идти раньше. Выведи через пробел.

Пример:
Ввод:
5
-3 1 -1 2 3
Вывод: -1 1 2 -3 3`,
starter: MAINV,
tests: [{ in: '5\n-3 1 -1 2 3', out: '-1 1 2 -3 3' }, { in: '3\n0 -5 5', out: '0 -5 5' }, { in: '4\n10 -2 7 -7', out: '-2 -7 7 10' }],
hint: 'В лямбде: if (abs(a) != abs(b)) return abs(a) < abs(b); return a < b;',
solution: R`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    sort(v.begin(), v.end(), [](int a, int b) {
        if (abs(a) != abs(b)) return abs(a) < abs(b);
        return a < b;
    });
    for (int x : v) cout << x << " ";
    cout << endl;
    return 0;
}
` }
]};

const quiz = [
{ q: 'Что значит ‹c - \'a\'› для символа c = \'d\'?', o: ['0', '3', '4', '100'], a: 1, e: 'Коды букв идут подряд, поэтому разность даёт номер буквы в алфавите с нуля: a — 0, b — 1, c — 2, d — 3.' },
{ q: 'Почему в префиксных суммах массив делают на один элемент длиннее?', o: ['Так быстрее', 'pre[0] = 0 нужен, чтобы запрос с l = 1 не выходил за границы', 'Для защиты от ошибок компилятора', 'Это не нужно'], a: 1, e: 'Ответ на запрос — pre[r] - pre[l - 1]. При l = 1 нужен pre[0], и он должен быть равен нулю.' },
{ q: 'Какое условие обязательно для двоичного поиска?', o: ['Числа положительные', 'Массив отсортирован', 'Размер — степень двойки', 'Нет повторов'], a: 1, e: 'Мы отбрасываем половину массива, опираясь на порядок. В неотсортированном массиве это даст неверный ответ.' },
{ q: 'Чему равен НОД(48, 18) по алгоритму Евклида?', o: ['3', '6', '9', '12'], a: 1, e: '(48, 18) → (18, 12) → (12, 6) → (6, 0). Ответ — 6.' },
{ q: 'Зачем в решете внутренний цикл начинают с j = i * i?', o: ['Чтобы не выйти за массив', 'Меньшие кратные уже вычеркнуты меньшими простыми числами', 'Так требует компилятор', 'Чтобы пропустить само число i'], a: 1, e: 'Например, 2 * i вычеркнуто ещё при i = 2, а 3 * i — при i = 3. Новая работа начинается с i * i.' }
];

const ref = [
{ t: 'Счётчики символов', d: 'Массив по номеру буквы или цифры.', code: 'int cnt[26] = {0};\nfor (char c : s) cnt[c - \'a\']++;\nchar(\'a\' + i)      // номер -> буква\nc - \'0\'            // цифра -> число' },
{ t: 'Префиксные суммы', d: 'Сумма на отрезке за одно вычитание. Номера с 1.', code: 'vector<long long> pre(n + 1, 0);\nfor (int i = 1; i <= n; i++) pre[i] = pre[i - 1] + a[i];\n// сумма a[l..r] = pre[r] - pre[l - 1]' },
{ t: 'Двоичный поиск', d: 'Только для отсортированного массива.', code: 'int lo = 0, hi = n - 1, pos = -1;\nwhile (lo <= hi) {\n    int mid = (lo + hi) / 2;\n    if (v[mid] == x) { pos = mid; break; }\n    if (v[mid] < x) lo = mid + 1; else hi = mid - 1;\n}' },
{ t: 'НОД и НОК', d: 'Алгоритм Евклида.', code: 'long long g(long long a, long long b) {\n    return b == 0 ? a : g(b, a % b);\n}\n// НОК = a / g(a, b) * b' },
{ t: 'sort с лямбдой', d: 'Своё правило сравнения.', code: 'sort(v.begin(), v.end(), [](int a, int b) {\n    return a > b;   // по убыванию\n});' }
];

const at = D.modules.findIndex(m => m.id === 'm7');
D.modules.splice(at < 0 ? D.modules.length : at, 0, mod);
D.quizzes.m8 = quiz;
const refAt = D.ref.findIndex(r => r.t === 'Частые ошибки');
D.ref.splice(refAt < 0 ? D.ref.length : refAt, 0, ...ref);
})();
