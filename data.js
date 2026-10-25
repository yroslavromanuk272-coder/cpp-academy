/* Данные курса C++ Академия: уроки, квизы, справочник.
   Разметка теории: пустая строка = новый абзац; строка "- " = пункт списка; "# " = подзаголовок;
   ‹код› = код в тексте; **жирный**; блок кода между строками "@@" (или "@@run" — тогда можно открыть в песочнице). */
(function () {
const R = String.raw;
const MAIN = R`#include <iostream>
using namespace std;

int main() {
    // пиши код здесь

    return 0;
}
`;
const MAINV = R`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // пиши код здесь

    return 0;
}
`;

const modules = [
/* ============================ 1 ============================ */
{ id: 'm1', title: 'Первые шаги', color: '#78d2ff', lessons: [
{ id: 'l1', title: 'Hello, World', xp: 20,
theory: R`
Программа на C++ — это текст, который компилятор превращает в запускаемую программу. Здесь код запускается прямо в приложении — нажми «Запуск» на вкладке «Код».

@@run
#include <iostream>
using namespace std;

int main() {
    cout << "Привет!" << endl;
    return 0;
}
@@

Разберём по строкам:
- ‹#include <iostream>› — подключает библиотеку ввода-вывода.
- ‹using namespace std;› — позволяет писать ‹cout› вместо ‹std::cout›.
- ‹int main()› — главная функция: программа начинается с неё.
- ‹cout << ...› — вывод на экран. ‹endl› переводит строку (можно и ‹"\n"›).
- ‹;› заканчивает каждую инструкцию. Забытая точка с запятой — самая частая ошибка новичков.
- ‹return 0;› — «программа завершилась успешно».

Текст в двойных кавычках называется **строковым литералом**. Через ‹<<› можно выводить несколько значений подряд.
`,
task: R`Выведи на экран ровно такую строку:

Hello, C++!`,
starter: MAIN,
tests: [{ in: '', out: 'Hello, C++!' }],
hint: 'Используй cout << "текст" << endl; — текст должен совпадать буква в букву, включая запятую и восклицательный знак.',
solution: R`#include <iostream>
using namespace std;

int main() {
    cout << "Hello, C++!" << endl;
    return 0;
}
` },

{ id: 'l2', title: 'Переменные и типы', xp: 20,
theory: R`
Переменная — это именованная ячейка памяти. У каждой переменной есть **тип**, он говорит, что в ней хранится.

@@run
#include <iostream>
#include <string>
using namespace std;

int main() {
    int age = 20;            // целое число
    double pi = 3.14159;     // дробное число
    char grade = 'A';        // один символ
    bool ok = true;          // true или false
    string name = "Аня";     // строка
    cout << name << " " << age << " " << pi << endl;
    return 0;
}
@@

Основные типы:
- ‹int› — целые (примерно до ±2 миллиардов)
- ‹long long› — очень большие целые
- ‹double› — дробные числа
- ‹char› — один символ в одинарных кавычках
- ‹bool› — логическое значение
- ‹string› — текст в двойных кавычках

Имя переменной — буквы, цифры и ‹_›, но не с цифры. Регистр важен: ‹Age› и ‹age› — разные переменные.

Можно объявлять сразу несколько: ‹int a = 7, b = 5;›. Значение переменной можно менять: ‹a = a + 1;›.
`,
task: R`Объяви две переменные: int a = 7 и int b = 5.
Выведи через пробел их сумму и произведение.

Ожидаемый вывод:
12 35`,
starter: MAIN,
tests: [{ in: '', out: '12 35' }],
hint: 'cout << a + b << " " << a * b << endl;',
solution: R`#include <iostream>
using namespace std;

int main() {
    int a = 7, b = 5;
    cout << a + b << " " << a * b << endl;
    return 0;
}
` },

{ id: 'l3', title: 'Ввод данных', xp: 20,
theory: R`
Чтобы программа получала данные, используй ‹cin› и оператор ‹>>›. Стрелки смотрят «в переменную».

@@run
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;          // читаем два числа
    cout << a + b << endl;
    return 0;
}
@@

- ‹cin› пропускает пробелы и переводы строк, поэтому числа можно вводить через пробел или с новой строки.
- Тип переменной определяет, как читать: ‹int› — целое, ‹double› — дробное, ‹string› — слово до пробела.
- Во вкладке «Код» есть поле «Ввод» — туда пиши данные для программы.

Запомни направление: ‹cout <<› — «вывести», ‹cin >>› — «ввести».
`,
task: R`Прочитай два целых числа и выведи их сумму.

Пример:
Ввод: 3 4
Вывод: 7`,
starter: MAIN,
tests: [{ in: '3 4', out: '7' }, { in: '10 -2', out: '8' }, { in: '0 0', out: '0' }],
hint: 'Объяви int a, b; прочитай cin >> a >> b; выведи a + b.',
solution: R`#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}
` },

{ id: 'l4', title: 'Арифметика', xp: 25,
theory: R`
Операции: ‹+  -  *  /  %›. Особенность — **деление целых чисел отбрасывает дробную часть**:

@@run
#include <iostream>
using namespace std;

int main() {
    cout << 7 / 2 << endl;      // 3  (целое деление)
    cout << 7 % 2 << endl;      // 1  (остаток)
    cout << 7 / 2.0 << endl;    // 3.5 (одно из чисел дробное)
    int x = 10;
    x += 5;                     // x = x + 5
    x++;                        // x = x + 1
    cout << x << endl;          // 16
    return 0;
}
@@

- ‹a / b› для двух ‹int› даёт целое число. Нужна дробь — сделай одно из чисел ‹double›: ‹(double)a / b›.
- ‹a % b› — остаток от деления. ‹n % 2 == 0› — проверка на чётность.
- Деление на ноль — ошибка во время выполнения.
- Сокращения: ‹+=  -=  *=  /=  %=›, а также ‹++› и ‹--›.

Порядок действий как в математике: сначала ‹*  /  %›, потом ‹+  -›; скобки меняют порядок.
`,
task: R`Прочитай количество секунд n. Выведи, сколько это полных минут и сколько секунд остаётся, через пробел.

Пример:
Ввод: 125
Вывод: 2 5`,
starter: MAIN,
tests: [{ in: '125', out: '2 5' }, { in: '59', out: '0 59' }, { in: '3600', out: '60 0' }],
hint: 'Минуты — это n / 60 (целое деление), остаток секунд — n % 60.',
solution: R`#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    cout << n / 60 << " " << n % 60 << endl;
    return 0;
}
` }
]},

/* ============================ 2 ============================ */
{ id: 'm2', title: 'Условия', color: '#ff96c8', lessons: [
{ id: 'l5', title: 'if и else', xp: 25,
theory: R`
Условный оператор выбирает, какой код выполнить.

@@run
#include <iostream>
using namespace std;

int main() {
    int t = 25;
    if (t > 30) {
        cout << "Жарко" << endl;
    } else if (t > 15) {
        cout << "Тепло" << endl;
    } else {
        cout << "Холодно" << endl;
    }
    return 0;
}
@@

Операторы сравнения: ‹==  !=  <  >  <=  >=›.

**Главная ловушка:** ‹=› — присваивание, ‹==› — сравнение. Запись ‹if (x = 5)› не сравнивает, а кладёт 5 в ‹x›, и условие всегда истинно.

Если в ветке одна инструкция, фигурные скобки можно опустить, но с ними код надёжнее.
`,
task: R`Прочитай целое число n. Выведи even, если оно чётное, и odd, если нечётное.

Пример:
Ввод: 7
Вывод: odd`,
starter: MAIN,
tests: [{ in: '4', out: 'even' }, { in: '7', out: 'odd' }, { in: '0', out: 'even' }, { in: '-3', out: 'odd' }],
hint: 'Число чётное, если n % 2 == 0. Для отрицательных нечётных остаток -1, поэтому проверяй именно равенство нулю.',
solution: R`#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    if (n % 2 == 0) {
        cout << "even" << endl;
    } else {
        cout << "odd" << endl;
    }
    return 0;
}
` },

{ id: 'l6', title: 'Логические операции', xp: 25,
theory: R`
Условия можно объединять:
- ‹&&› — «и» (оба условия верны)
- ‹||› — «или» (хотя бы одно верно)
- ‹!› — «не» (переворачивает значение)

@@run
#include <iostream>
using namespace std;

int main() {
    int x = 15;
    if (x >= 10 && x <= 20) cout << "в диапазоне" << endl;
    if (x < 0 || x > 100)   cout << "вне диапазона" << endl;
    bool ok = !(x == 15);
    cout << ok << endl;     // 0 (false)
    return 0;
}
@@

Важно: ‹10 <= x <= 20› в C++ работает не так, как в математике. Пиши ‹x >= 10 && x <= 20›.

Правила де Моргана: ‹!(a || b)› то же самое, что ‹!a && !b›.

Высокосный год: делится на 4, но не на 100, **или** делится на 400.
`,
task: R`Прочитай год. Выведи YES, если он високосный, иначе NO.

Год високосный, если он делится на 4 и не делится на 100, либо делится на 400.`,
starter: MAIN,
tests: [{ in: '2000', out: 'YES' }, { in: '1900', out: 'NO' }, { in: '2024', out: 'YES' }, { in: '2023', out: 'NO' }],
hint: 'Условие: (y % 4 == 0 && y % 100 != 0) || y % 400 == 0',
solution: R`#include <iostream>
using namespace std;

int main() {
    int y;
    cin >> y;
    if ((y % 4 == 0 && y % 100 != 0) || y % 400 == 0) {
        cout << "YES" << endl;
    } else {
        cout << "NO" << endl;
    }
    return 0;
}
` },

{ id: 'l7', title: 'switch и тернарный оператор', xp: 25,
theory: R`
Когда нужно сравнить одну величину с несколькими значениями, удобен ‹switch›:

@@run
#include <iostream>
using namespace std;

int main() {
    int d = 2;
    switch (d) {
        case 1: cout << "один" << endl; break;
        case 2: cout << "два" << endl; break;
        default: cout << "другое" << endl;
    }
    return 0;
}
@@

- Каждая ветка заканчивается ‹break›. Без него выполнение «проваливается» в следующую ветку.
- ‹default› срабатывает, если ни один ‹case› не подошёл.
- ‹switch› работает с целыми числами и символами (‹char›), но не со строками.

**Тернарный оператор** — короткий if/else внутри выражения:

@@run
#include <iostream>
using namespace std;

int main() {
    int a = 5, b = 9;
    int m = (a > b) ? a : b;   // большее из двух
    cout << m << endl;
    return 0;
}
@@
`,
task: R`Прочитай номер дня недели от 1 до 7. Выведи его сокращённое название: Mon Tue Wed Thu Fri Sat Sun. Для любого другого числа выведи ?.

Пример:
Ввод: 3
Вывод: Wed`,
starter: MAIN,
tests: [{ in: '1', out: 'Mon' }, { in: '3', out: 'Wed' }, { in: '7', out: 'Sun' }, { in: '9', out: '?' }, { in: '0', out: '?' }],
hint: 'Сделай switch (d) с семью case, в каждом cout << "Mon"; break; а в default выведи "?".',
solution: R`#include <iostream>
using namespace std;

int main() {
    int d;
    cin >> d;
    switch (d) {
        case 1: cout << "Mon"; break;
        case 2: cout << "Tue"; break;
        case 3: cout << "Wed"; break;
        case 4: cout << "Thu"; break;
        case 5: cout << "Fri"; break;
        case 6: cout << "Sat"; break;
        case 7: cout << "Sun"; break;
        default: cout << "?";
    }
    cout << endl;
    return 0;
}
` }
]},

/* ============================ 3 ============================ */
{ id: 'm3', title: 'Циклы', color: '#ffaf46', lessons: [
{ id: 'l8', title: 'Цикл for', xp: 25,
theory: R`
Цикл ‹for› повторяет код заданное число раз. В скобках три части: **старт; условие; шаг**.

@@run
#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 5; i++) {
        cout << i << " ";
    }
    cout << endl;
    return 0;
}
@@

Как это работает:
- ‹int i = 1› — выполняется один раз перед циклом;
- ‹i <= 5› — проверяется перед каждым повтором;
- ‹i++› — выполняется после каждого повтора.

Частые варианты: счёт с нуля ‹for (int i = 0; i < n; i++)› (то есть n повторов), счёт вниз ‹for (int i = n; i >= 1; i--)›, шаг 2 — ‹i += 2›.

Переменная ‹i› существует только внутри цикла.
`,
task: R`Прочитай n. Выведи числа от 1 до n через пробел.

Пример:
Ввод: 5
Вывод: 1 2 3 4 5`,
starter: MAIN,
tests: [{ in: '5', out: '1 2 3 4 5' }, { in: '1', out: '1' }, { in: '8', out: '1 2 3 4 5 6 7 8' }],
hint: 'for (int i = 1; i <= n; i++) { cout << i << " "; }',
solution: R`#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    for (int i = 1; i <= n; i++) {
        cout << i << " ";
    }
    cout << endl;
    return 0;
}
` },

{ id: 'l9', title: 'Цикл while', xp: 25,
theory: R`
‹while› повторяет код, пока условие истинно. Его используют, когда число повторов заранее неизвестно.

@@run
#include <iostream>
using namespace std;

int main() {
    int n = 1234, count = 0;
    while (n > 0) {
        n = n / 10;     // отбрасываем последнюю цифру
        count++;
    }
    cout << count << endl;   // 4 цифры
    return 0;
}
@@

Полезный приём для цифр числа:
- ‹n % 10› — последняя цифра;
- ‹n / 10› — число без последней цифры.

Если условие никогда не станет ложным, получится **бесконечный цикл**. Приложение остановит программу, но в реальности такая программа «зависнет».

Есть ещё ‹do { ... } while (условие);› — он выполняется минимум один раз, условие проверяется в конце.
`,
task: R`Прочитай натуральное число n. Выведи сумму его цифр.

Пример:
Ввод: 1234
Вывод: 10`,
starter: MAIN,
tests: [{ in: '1234', out: '10' }, { in: '7', out: '7' }, { in: '1000', out: '1' }, { in: '99999', out: '45' }],
hint: 'Пока n > 0: добавляй n % 10 к сумме, затем n /= 10.',
solution: R`#include <iostream>
using namespace std;

int main() {
    int n, s = 0;
    cin >> n;
    while (n > 0) {
        s += n % 10;
        n /= 10;
    }
    cout << s << endl;
    return 0;
}
` },

{ id: 'l10', title: 'Вложенные циклы', xp: 30,
theory: R`
Цикл можно поместить внутрь другого. Внешний отвечает за строки, внутренний — за элементы в строке.

@@run
#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 3; i++) {
        for (int j = 1; j <= i; j++) {
            cout << "*";
        }
        cout << endl;   // конец строки
    }
    return 0;
}
@@

Результат — «лесенка»:
@@
*
**
***
@@

Внутренний цикл выполняется полностью на каждом шаге внешнего. Если внешний делает 3 шага, а внутренний 4, всего будет 12 повторов.

Используй разные имена счётчиков (‹i›, ‹j›, ‹k›), чтобы не запутаться.
`,
task: R`Прочитай n. Выведи «лесенку» из n строк: в i-й строке i звёздочек.

Пример:
Ввод: 3
Вывод:
*
**
***`,
starter: MAIN,
tests: [{ in: '3', out: '*\n**\n***' }, { in: '1', out: '*' }, { in: '4', out: '*\n**\n***\n****' }],
hint: 'Внешний цикл по строкам i от 1 до n, внутренний печатает i звёздочек, после него — endl.',
solution: R`#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            cout << "*";
        }
        cout << endl;
    }
    return 0;
}
` },

{ id: 'l11', title: 'break и continue', xp: 25,
theory: R`
- ‹break› — немедленно выйти из цикла.
- ‹continue› — пропустить остаток тела и перейти к следующему повтору.

@@run
#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 10; i++) {
        if (i % 2 == 0) continue;   // чётные пропускаем
        if (i > 7) break;           // дальше 7 не идём
        cout << i << " ";
    }
    cout << endl;                   // 1 3 5 7
    return 0;
}
@@

Типичные задачи на ‹break›: поиск первого подходящего элемента, выход при вводе «стоп»-значения.

В цикле ‹for› после ‹continue› всё равно выполняется шаг (‹i++›). В ‹while› будь внимателен: если шаг стоит в конце тела, ‹continue› его пропустит, и цикл может зациклиться.
`,
task: R`Прочитай n. Выведи сумму всех чисел от 1 до n, которые делятся на 3 или на 5.

Пример:
Ввод: 10
Вывод: 33  (3 + 5 + 6 + 9 + 10)`,
starter: MAIN,
tests: [{ in: '10', out: '33' }, { in: '15', out: '60' }, { in: '2', out: '0' }, { in: '100', out: '2418' }],
hint: 'В цикле от 1 до n: если число не делится ни на 3, ни на 5 — continue; иначе прибавь его к сумме.',
solution: R`#include <iostream>
using namespace std;

int main() {
    int n, s = 0;
    cin >> n;
    for (int i = 1; i <= n; i++) {
        if (i % 3 != 0 && i % 5 != 0) continue;
        s += i;
    }
    cout << s << endl;
    return 0;
}
` }
]},

/* ============================ 4 ============================ */
{ id: 'm4', title: 'Строки', color: '#5ae196', lessons: [
{ id: 'l12', title: 'Основы string', xp: 25,
theory: R`
Тип ‹string› хранит текст. Нужен ‹#include <string>› (обычно подключается вместе с ‹iostream›).

@@run
#include <iostream>
#include <string>
using namespace std;

int main() {
    string s = "hello";
    cout << s.size() << endl;     // 5  (длина)
    cout << s[0] << endl;         // h  (первый символ)
    cout << s[s.size() - 1] << endl;  // o  (последний)
    s = s + " world";             // склейка
    cout << s << endl;
    return 0;
}
@@

- Символы нумеруются с **нуля**: первый — ‹s[0]›, последний — ‹s[s.size()-1]›.
- ‹s.size()› и ‹s.length()› — одно и то же.
- ‹cin >> s› читает одно слово до пробела. Для строки с пробелами — ‹getline› (следующий урок).
- Строки сравниваются ‹==›, ‹<›, ‹>› (по алфавиту).
`,
task: R`Прочитай одно слово. Выведи через пробел его длину и первый символ.

Пример:
Ввод: hello
Вывод: 5 h`,
starter: MAIN,
tests: [{ in: 'hello', out: '5 h' }, { in: 'C++', out: '3 C' }, { in: 'x', out: '1 x' }],
hint: 'string s; cin >> s; cout << s.size() << " " << s[0];',
solution: R`#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    cout << s.size() << " " << s[0] << endl;
    return 0;
}
` },

{ id: 'l13', title: 'Операции со строками', xp: 30,
theory: R`
Полезные операции со строкой ‹s›:
- ‹s += "abc"› или ‹s += 'x'› — дописать в конец;
- ‹s.substr(pos, len)› — подстрока длиной ‹len› с позиции ‹pos›;
- ‹s.find("ab")› — позиция первого вхождения (или ‹-1›, если не нашли);
- ‹s.push_back('c')›, ‹s.pop_back()› — добавить/убрать символ в конце;
- ‹s.empty()› — пустая ли строка.

@@run
#include <iostream>
#include <string>
using namespace std;

int main() {
    string s = "programming";
    cout << s.substr(0, 3) << endl;   // pro
    cout << s.find("gram") << endl;   // 3
    string r = "";
    for (int i = s.size() - 1; i >= 0; i--) {
        r += s[i];                    // собираем наоборот
    }
    cout << r << endl;
    return 0;
}
@@

Числа и строки напрямую не склеиваются: ‹"a" + 5› — ошибка. Используй ‹to_string(5)› для числа → строка и ‹stoi("42")› для строки → число.
`,
task: R`Прочитай слово и выведи его задом наперёд.

Пример:
Ввод: abc
Вывод: cba`,
starter: MAIN,
tests: [{ in: 'abc', out: 'cba' }, { in: 'racecar', out: 'racecar' }, { in: 'x', out: 'x' }, { in: 'Hello', out: 'olleH' }],
hint: 'Создай пустую строку r и в цикле от s.size()-1 до 0 добавляй s[i]. Не забудь, что size() — не int; цикл с int i = s.size() - 1 работает нормально.',
solution: R`#include <iostream>
#include <string>
using namespace std;

int main() {
    string s, r = "";
    cin >> s;
    for (int i = s.size() - 1; i >= 0; i--) {
        r += s[i];
    }
    cout << r << endl;
    return 0;
}
` },

{ id: 'l14', title: 'getline и символы', xp: 30,
theory: R`
Чтобы прочитать строку **с пробелами**, используй ‹getline›:

@@run
#include <iostream>
#include <string>
using namespace std;

int main() {
    string line;
    getline(cin, line);
    cout << "Длина: " << line.size() << endl;
    return 0;
}
@@

**Ловушка:** после ‹cin >> n› в буфере остаётся перевод строки. Следующий ‹getline› прочитает пустую строку. Лечится так: ‹cin.ignore();› перед ‹getline›.

Символ ‹char› — это маленькое число (код). Поэтому с символами можно считать:
- ‹'a' + 1› — это код буквы ‹b›;
- ‹c - 'a'› — номер буквы в алфавите (0 для ‹a›);
- ‹tolower(c)›, ‹toupper(c)› — смена регистра (возвращают int: для вывода как буквы преобразуй ‹char(...)›);
- ‹isdigit(c)›, ‹isalpha(c)› — проверки.

Перебор символов строки: ‹for (char c : s) { ... }›.
`,
task: R`Прочитай строку (она может содержать пробелы). Выведи, сколько в ней гласных латинских букв a e i o u (регистр не важен).

Пример:
Ввод: hello world
Вывод: 3`,
starter: MAIN,
tests: [{ in: 'hello world', out: '3' }, { in: 'xyz', out: '0' }, { in: 'AEIOU aeiou', out: '10' }, { in: 'Programming in C++', out: '4' }],
hint: 'getline(cin, s); затем for (char c : s) { c = tolower(c); если c — одна из пяти гласных, увеличь счётчик. }',
solution: R`#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    getline(cin, s);
    int cnt = 0;
    for (char c : s) {
        c = tolower(c);
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
            cnt++;
        }
    }
    cout << cnt << endl;
    return 0;
}
` }
]},

/* ============================ 5 ============================ */
{ id: 'm5', title: 'Массивы и vector', color: '#c8a0ff', lessons: [
{ id: 'l15', title: 'Массивы', xp: 30,
theory: R`
Массив хранит несколько значений одного типа под одним именем.

@@run
#include <iostream>
using namespace std;

int main() {
    int a[5] = {4, 8, 15, 16, 23};
    cout << a[0] << " " << a[4] << endl;   // 4 23
    a[2] = 100;                             // изменить элемент
    int sum = 0;
    for (int i = 0; i < 5; i++) sum += a[i];
    cout << sum << endl;
    return 0;
}
@@

- Элементы нумеруются с **0**. У массива из 5 элементов индексы 0…4.
- Выход за границы (‹a[5]›) — опасная ошибка: в настоящем C++ она может молча портить память. Здесь приложение сообщит об ошибке.
- Размер задают числом или константой: ‹int a[100];›. Читать данные обычно удобно циклом: ‹for (int i = 0; i < n; i++) cin >> a[i];›.
- Размер нельзя поменять после создания — для этого есть ‹vector›.
`,
task: R`Первое число — n (количество чисел, не больше 100), затем n целых чисел. Выведи наибольшее из них.

Пример:
Ввод:
5
3 9 2 7 1
Вывод: 9`,
starter: R`#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int a[100];
    // прочитай n чисел в массив и найди максимум

    return 0;
}
`,
tests: [{ in: '5\n3 9 2 7 1', out: '9' }, { in: '3\n-5 -2 -9', out: '-2' }, { in: '1\n4', out: '4' }],
hint: 'Начни с max = a[0]. Затем для i от 1 до n-1: если a[i] > max, обнови max. Не начинай с 0 — все числа могут быть отрицательными.',
solution: R`#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int a[100];
    for (int i = 0; i < n; i++) cin >> a[i];
    int mx = a[0];
    for (int i = 1; i < n; i++) {
        if (a[i] > mx) mx = a[i];
    }
    cout << mx << endl;
    return 0;
}
` },

{ id: 'l16', title: 'vector', xp: 30,
theory: R`
‹vector› — «умный» массив: он сам растёт. Нужен ‹#include <vector>›.

@@run
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> v;            // пустой
    v.push_back(10);          // добавить в конец
    v.push_back(20);
    v.push_back(30);
    cout << v.size() << endl; // 3
    cout << v[1] << endl;     // 20
    v.pop_back();             // убрать последний
    for (int x : v) cout << x << " ";
    cout << endl;
    return 0;
}
@@

Основное:
- ‹vector<int> v(n);› — n нулей;  ‹vector<int> v(n, 5);› — n пятёрок;
- ‹v.size()›, ‹v.empty()›, ‹v.back()›, ‹v.front()›, ‹v.clear()›;
- ‹for (int x : v)› — перебрать все элементы; ‹for (int& x : v)› — перебрать с возможностью менять;
- внутри ‹< >› может быть любой тип: ‹vector<string>›, ‹vector<double>›.
`,
task: R`Первое число — n, затем n целых чисел. Выведи эти числа в обратном порядке через пробел.

Пример:
Ввод:
3
1 2 3
Вывод: 3 2 1`,
starter: MAINV,
tests: [{ in: '3\n1 2 3', out: '3 2 1' }, { in: '1\n7', out: '7' }, { in: '5\n10 20 30 40 50', out: '50 40 30 20 10' }],
hint: 'Читай числа в цикле и делай v.push_back(x). Потом выводи в цикле for (int i = n - 1; i >= 0; i--).',
solution: R`#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> v;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        v.push_back(x);
    }
    for (int i = n - 1; i >= 0; i--) {
        cout << v[i] << " ";
    }
    cout << endl;
    return 0;
}
` },

{ id: 'l17', title: 'Сортировка и algorithm', xp: 30,
theory: R`
В библиотеке ‹<algorithm>› живут готовые алгоритмы. Самый частый — ‹sort›.

@@run
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> v = {5, 2, 9, 1};
    sort(v.begin(), v.end());                 // по возрастанию
    for (int x : v) cout << x << " ";
    cout << endl;
    sort(v.begin(), v.end(), greater<int>()); // по убыванию
    for (int x : v) cout << x << " ";
    cout << endl;
    return 0;
}
@@

- ‹v.begin()› и ‹v.end()› задают диапазон «от начала до конца».
- Для обычного массива: ‹sort(a, a + n);›
- ‹reverse(v.begin(), v.end())› — развернуть;
- ‹*max_element(v.begin(), v.end())› и ‹*min_element(...)› — наибольший и наименьший;
- ‹accumulate(v.begin(), v.end(), 0)› — сумма (нужен ‹#include <numeric>›, но здесь работает и так).
- Свой порядок сортировки задаёт функция-сравнение: ‹[](int a, int b) { return a > b; }›.
`,
task: R`Первое число — n, затем n целых чисел. Выведи их по возрастанию через пробел.

Пример:
Ввод:
4
4 2 9 1
Вывод: 1 2 4 9`,
starter: MAINV,
tests: [{ in: '4\n4 2 9 1', out: '1 2 4 9' }, { in: '1\n5', out: '5' }, { in: '5\n5 4 3 2 1', out: '1 2 3 4 5' }, { in: '6\n3 -1 3 0 -7 2', out: '-7 -1 0 2 3 3' }],
hint: 'Прочитай в vector<int> v(n) и вызови sort(v.begin(), v.end()).',
solution: R`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    sort(v.begin(), v.end());
    for (int x : v) cout << x << " ";
    cout << endl;
    return 0;
}
` },

{ id: 'l18', title: 'Двумерные массивы', xp: 35,
theory: R`
Таблица — это «массив массивов». Самый удобный способ — вектор векторов:

@@run
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n = 3, m = 4;
    vector<vector<int>> g(n, vector<int>(m, 0));  // n строк, m столбцов, всё нули
    g[1][2] = 7;                                  // строка 1, столбец 2
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            cout << g[i][j] << " ";
        }
        cout << endl;
    }
    return 0;
}
@@

- ‹g[i][j]›: сначала номер строки, потом столбца.
- ‹g.size()› — число строк, ‹g[0].size()› — число столбцов.
- Обычный двумерный массив: ‹int a[3][4];›.
- Обход таблицы — всегда два вложенных цикла.
`,
task: R`Прочитай n. Выведи таблицу умножения n × n: в строке i (от 1) числа i·1, i·2, …, i·n через пробел.

Пример:
Ввод: 3
Вывод:
1 2 3
2 4 6
3 6 9`,
starter: MAINV,
tests: [{ in: '3', out: '1 2 3\n2 4 6\n3 6 9' }, { in: '1', out: '1' }, { in: '4', out: '1 2 3 4\n2 4 6 8\n3 6 9 12\n4 8 12 16' }],
hint: 'Два вложенных цикла: i по строкам, j по столбцам; выводи i * j и пробел, после внутреннего цикла — endl.',
solution: R`#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<vector<int>> g(n, vector<int>(n));
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            g[i][j] = (i + 1) * (j + 1);
        }
    }
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cout << g[i][j] << " ";
        }
        cout << endl;
    }
    return 0;
}
` }
]},

/* ============================ 6 ============================ */
{ id: 'm6', title: 'Функции', color: '#ffe28c', lessons: [
{ id: 'l19', title: 'Функции', xp: 30,
theory: R`
Функция — именованный кусок кода, который можно вызывать много раз.

@@run
#include <iostream>
using namespace std;

int square(int x) {          // тип результата, имя, параметры
    return x * x;            // вернуть значение
}

void hello(string name) {    // void — ничего не возвращает
    cout << "Привет, " << name << "!" << endl;
}

int main() {
    cout << square(5) << endl;
    hello("мир");
    return 0;
}
@@

- Функцию нужно объявить **выше** того места, где она вызывается (или заранее написать прототип: ‹int square(int x);›).
- ‹return› немедленно завершает функцию и отдаёт результат.
- Параметры по умолчанию получают **копии** значений: изменение внутри функции не затрагивает исходную переменную.
- Можно задать значение по умолчанию: ‹int add(int a, int b = 10)›.
`,
task: R`В заготовке написан ввод и вывод. Допиши функцию sq, которая возвращает квадрат числа x.

Пример:
Ввод: 5
Вывод: 25`,
starter: R`#include <iostream>
using namespace std;

int sq(int x) {
    // допиши: верни квадрат x
    return 0;
}

int main() {
    int x;
    cin >> x;
    cout << sq(x) << endl;
    return 0;
}
`,
tests: [{ in: '5', out: '25' }, { in: '-3', out: '9' }, { in: '0', out: '0' }, { in: '12', out: '144' }],
hint: 'Замени return 0; на return x * x;',
solution: R`#include <iostream>
using namespace std;

int sq(int x) {
    return x * x;
}

int main() {
    int x;
    cin >> x;
    cout << sq(x) << endl;
    return 0;
}
` },

{ id: 'l20', title: 'Ссылки', xp: 30,
theory: R`
Обычный параметр — копия. Если нужно, чтобы функция **изменила** переменную вызывающего кода, параметр делают ссылкой — добавляют ‹&›.

@@run
#include <iostream>
using namespace std;

void addOne(int& x) {     // x — это сама переменная, а не копия
    x = x + 1;
}

int main() {
    int a = 5;
    addOne(a);
    cout << a << endl;    // 6
    return 0;
}
@@

Где ещё нужны ссылки:
- Вернуть из функции несколько результатов (через несколько ссылочных параметров).
- Не копировать большие данные: ‹void f(const vector<int>& v)›. Слово ‹const› запрещает функции менять вектор.
- Цикл с изменением элементов: ‹for (int& x : v) x *= 2;›
- Готовая функция обмена: ‹swap(a, b)›.
`,
task: R`Допиши функцию swap2, которая меняет местами значения двух переменных. Использовать готовую swap нельзя — напиши обмен сам.

Пример:
Ввод: 1 2
Вывод: 2 1`,
starter: R`#include <iostream>
using namespace std;

void swap2(int& a, int& b) {
    // допиши: поменяй a и b местами
}

int main() {
    int a, b;
    cin >> a >> b;
    swap2(a, b);
    cout << a << " " << b << endl;
    return 0;
}
`,
tests: [{ in: '1 2', out: '2 1' }, { in: '5 5', out: '5 5' }, { in: '-1 7', out: '7 -1' }],
hint: 'Нужна третья переменная: int t = a; a = b; b = t;',
solution: R`#include <iostream>
using namespace std;

void swap2(int& a, int& b) {
    int t = a;
    a = b;
    b = t;
}

int main() {
    int a, b;
    cin >> a >> b;
    swap2(a, b);
    cout << a << " " << b << endl;
    return 0;
}
` },

{ id: 'l21', title: 'Рекурсия', xp: 35,
theory: R`
Рекурсия — это когда функция вызывает саму себя. У рекурсивной функции всегда две части:
- **база** — случай, когда ответ известен сразу (иначе рекурсия не остановится);
- **шаг** — сведение задачи к такой же, но меньшей.

Факториал: ‹n! = n · (n-1)!›, а ‹0! = 1›.

@@run
#include <iostream>
using namespace std;

long long fact(int n) {
    if (n <= 1) return 1;          // база
    return n * fact(n - 1);        // шаг
}

int main() {
    cout << fact(5) << endl;       // 120
    return 0;
}
@@

Как это выполняется: ‹fact(3)› → ‹3 * fact(2)› → ‹3 * (2 * fact(1))› → ‹3 * 2 * 1›.

- Забыл базу — получишь «Переполнение стека»: вызовы копятся бесконечно.
- Для больших результатов используй ‹long long›: ‹int› переполняется уже на 13!.
- Любую рекурсию можно записать циклом; рекурсия просто иногда короче и яснее (обход деревьев, перебор).
`,
task: R`Допиши рекурсивную функцию fact, которая возвращает n! (n от 0 до 15). Цикл использовать не нужно.

Пример:
Ввод: 5
Вывод: 120`,
starter: R`#include <iostream>
using namespace std;

long long fact(int n) {
    // допиши: база и рекурсивный шаг
    return 0;
}

int main() {
    int n;
    cin >> n;
    cout << fact(n) << endl;
    return 0;
}
`,
tests: [{ in: '5', out: '120' }, { in: '0', out: '1' }, { in: '10', out: '3628800' }, { in: '15', out: '1307674368000' }],
hint: 'Если n <= 1, верни 1. Иначе верни n * fact(n - 1).',
solution: R`#include <iostream>
using namespace std;

long long fact(int n) {
    if (n <= 1) return 1;
    return n * fact(n - 1);
}

int main() {
    int n;
    cin >> n;
    cout << fact(n) << endl;
    return 0;
}
` },

{ id: 'l22', title: 'vector в функции и форматирование', xp: 35,
theory: R`
Вектор удобно передавать в функцию по константной ссылке: без копирования и без права менять.

@@run
#include <iostream>
#include <vector>
#include <iomanip>
using namespace std;

double average(const vector<int>& v) {
    double sum = 0;
    for (int x : v) sum += x;
    return sum / v.size();
}

int main() {
    vector<int> v = {1, 2, 4};
    cout << fixed << setprecision(2) << average(v) << endl;   // 2.33
    return 0;
}
@@

Форматирование вывода (нужен ‹#include <iomanip>›):
- ‹fixed› + ‹setprecision(n)› — ровно n знаков после запятой;
- ‹setw(n)› — выровнять следующее значение по ширине n;
- без ‹fixed› число выводится «как получится» (примерно 6 значащих цифр).

Обрати внимание: ‹sum› объявлена как ‹double›, иначе деление было бы целым.
`,
task: R`Допиши функцию average, которая возвращает среднее арифметическое чисел вектора (double). В main числа уже читаются, а ответ печатается с двумя знаками после запятой.

Пример:
Ввод:
3
1 2 4
Вывод: 2.33`,
starter: R`#include <iostream>
#include <vector>
#include <iomanip>
using namespace std;

double average(const vector<int>& v) {
    // допиши: сумма элементов, делённая на их количество
    return 0;
}

int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    cout << fixed << setprecision(2) << average(v) << endl;
    return 0;
}
`,
tests: [{ in: '3\n1 2 4', out: '2.33' }, { in: '2\n5 5', out: '5.00' }, { in: '4\n1 2 3 4', out: '2.50' }],
hint: 'Заведи double sum = 0; пройди циклом по v, добавляя элементы, и верни sum / v.size().',
solution: R`#include <iostream>
#include <vector>
#include <iomanip>
using namespace std;

double average(const vector<int>& v) {
    double sum = 0;
    for (int x : v) sum += x;
    return sum / v.size();
}

int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    cout << fixed << setprecision(2) << average(v) << endl;
    return 0;
}
` }
]},

/* ============================ 7 ============================ */
{ id: 'm7', title: 'Структуры и дальше', color: '#ff8a65', lessons: [
{ id: 'l23', title: 'struct', xp: 35,
theory: R`
Структура объединяет несколько значений (возможно, разных типов) в один новый тип.

@@run
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Student {
    string name;
    int age;
    double grade;
};

int main() {
    Student s = {"Аня", 19, 4.7};
    cout << s.name << " " << s.age << endl;
    s.age = 20;                              // поля можно менять

    vector<Student> group;
    group.push_back(s);
    group.push_back({"Боря", 21, 4.2});
    for (Student st : group) cout << st.name << ": " << st.grade << endl;
    return 0;
}
@@

- Объявление ‹struct Имя { поля };› стоит **вне** функций, перед ‹main›. Не забудь ‹;› после ‹}›.
- К полям обращаются через точку: ‹s.name›.
- Структуры можно хранить в массивах и ‹vector›, передавать в функции и возвращать из них.
- В этом приложении внутри ‹struct› пока можно описывать только поля (методы и конструкторы — в полноценном C++, это следующий шаг обучения).
`,
task: R`Структура Point уже объявлена. Прочитай координаты двух точек: x1 y1 x2 y2. Выведи манхэттенское расстояние между ними: |x1 − x2| + |y1 − y2|.

Пример:
Ввод: 1 2 4 6
Вывод: 7`,
starter: R`#include <iostream>
#include <cmath>
using namespace std;

struct Point {
    int x, y;
};

int main() {
    Point a, b;
    // прочитай a.x, a.y, b.x, b.y и выведи расстояние

    return 0;
}
`,
tests: [{ in: '1 2 4 6', out: '7' }, { in: '0 0 0 0', out: '0' }, { in: '-1 -1 1 1', out: '4' }, { in: '5 5 2 9', out: '7' }],
hint: 'cin >> a.x >> a.y >> b.x >> b.y; ответ: abs(a.x - b.x) + abs(a.y - b.y).',
solution: R`#include <iostream>
#include <cmath>
using namespace std;

struct Point {
    int x, y;
};

int main() {
    Point a, b;
    cin >> a.x >> a.y >> b.x >> b.y;
    cout << abs(a.x - b.x) + abs(a.y - b.y) << endl;
    return 0;
}
` },

{ id: 'l24', title: 'Что дальше', xp: 20, noTask: true,
theory: R`
Ты прошёл основы C++. Вот что стоит изучить дальше. Эти темы пока не поддерживаются встроенным запуском кода в приложении, поэтому примеры ниже только для чтения — пробуй их на компьютере (например, на онлайн-компиляторе) или в среде разработки.

# Указатели

Указатель хранит **адрес** переменной в памяти.

@@
int a = 5;
int* p = &a;     // p указывает на a
*p = 10;         // изменили a через указатель
cout << a;       // 10
@@

# Классы

Класс объединяет данные и функции для работы с ними.

@@
class Counter {
public:
    void add() { value++; }
    int get() { return value; }
private:
    int value = 0;
};
@@

# Контейнеры STL

@@
map<string, int> ages;      // словарь: ключ -> значение
ages["Аня"] = 19;
set<int> s = {3, 1, 3};     // множество без повторов
@@

# План обучения
- Указатели и динамическая память (‹new›, ‹delete›)
- Классы, конструкторы, наследование
- ‹map›, ‹set›, ‹queue›, ‹stack›
- Работа с файлами (‹ifstream›, ‹ofstream›)
- Разбор алгоритмов: поиск, сортировки, графы

Главный совет: решай много небольших задач — навык приходит с практикой.
` }
]}
];

/* ============================ КВИЗЫ ============================ */
const quizzes = {
m1: [
{ q: 'Что выведет cout << 5 / 2; ?', o: ['2.5', '2', '3', 'Ошибка компиляции'], a: 1, e: 'Оба числа целые, поэтому деление целочисленное: дробная часть отбрасывается. Для 2.5 нужно, чтобы одно из чисел было double: 5 / 2.0.' },
{ q: 'Какая строка правильно объявляет целую переменную?', o: ['int x = 5;', 'integer x = 5;', 'x = int 5;', 'var x = 5;'], a: 0, e: 'В C++ сначала пишется тип, затем имя и значение. integer и var — не C++.' },
{ q: 'Что делает оператор ‹cin >> a;›?', o: ['Выводит a на экран', 'Читает значение для a с ввода', 'Сравнивает a с вводом', 'Удаляет a'], a: 1, e: 'cin — поток ввода: cin >> a читает значение и кладёт его в переменную a.' },
{ q: 'Что выведет этот код?', code: 'int a = 7;\ndouble b = a / 2;\ncout << b;', o: ['3.5', '3', '4', '3.0'], a: 1, e: 'Сначала вычисляется a / 2 как целочисленное деление (7 / 2 = 3), и только потом результат превращается в double. Выведется 3.' },
{ q: 'Чем заканчивается каждая инструкция в C++?', o: ['Точкой', 'Двоеточием', 'Точкой с запятой', 'Ничем'], a: 2, e: 'Точка с запятой завершает инструкцию. Её пропуск — самая частая ошибка новичков.' }
],
m2: [
{ q: 'Что делает ‹if (x = 5)›?', o: ['Проверяет, равен ли x пяти', 'Присваивает x значение 5, условие истинно', 'Вызывает ошибку компиляции', 'Условие всегда ложно'], a: 1, e: 'Один знак = это присваивание. Условие считается истинным, потому что 5 не равно нулю. Для сравнения нужен ==.' },
{ q: 'Чему равно выражение ‹5 > 3 && 2 > 4›?', o: ['true', 'false', '5', 'Ошибка'], a: 1, e: '&& требует, чтобы оба условия были верны. 2 > 4 ложно, значит и всё выражение ложно.' },
{ q: 'Что выведет этот код?', code: 'switch (2) {\n  case 1: cout << "A";\n  case 2: cout << "B";\n  case 3: cout << "C"; break;\n  default: cout << "D";\n}', o: ['B', 'BC', 'BCD', 'ABC'], a: 1, e: 'После case 2 нет break, поэтому выполнение «проваливается» в case 3 и там останавливается на break. Выведется BC.' },
{ q: 'Какое выражение равно ‹!(a || b)›?', o: ['!a || !b', '!a && !b', 'a && b', 'a || !b'], a: 1, e: 'Это закон де Моргана: отрицание «или» — это «и» отрицаний.' }
],
m3: [
{ q: 'Что выведет цикл ‹for (int i = 0; i < 3; i++) cout << i;›?', o: ['123', '012', '0123', '012345'], a: 1, e: 'i принимает значения 0, 1, 2 — на значении 3 условие i < 3 ложно, цикл завершается.' },
{ q: 'Чем отличается break от continue?', o: ['Ничем', 'break выходит из цикла, continue пропускает текущий повтор', 'break пропускает повтор, continue выходит из цикла', 'break завершает программу'], a: 1, e: 'break прерывает цикл целиком, continue переходит к следующему повтору.' },
{ q: 'Сколько раз выполнится тело цикла?', code: 'int i = 10;\nwhile (i > 0) i -= 3;', o: ['3', '4', '5', 'Бесконечно'], a: 1, e: 'i будет 10, 7, 4, 1 — четыре повтора, затем i станет -2 и условие нарушится.' },
{ q: 'Что выведет этот код?', code: 'int i = 5;\ndo { cout << i; } while (i < 3);', o: ['Ничего', '5', '53', 'Ошибка'], a: 1, e: 'do-while проверяет условие после тела, поэтому тело выполняется минимум один раз.' }
],
m4: [
{ q: 'Чему равно ‹s[1]› для ‹string s = "hello";›?', o: ["'h'", "'e'", "'l'", "'o'"], a: 1, e: 'Символы нумеруются с нуля: s[0] — h, s[1] — e.' },
{ q: 'Чему равно ‹s.size()› для строки "abc"?', o: ['2', '3', '4', '0'], a: 1, e: 'В строке три символа.' },
{ q: 'Как получить строку из числа 42?', o: ['string(42)', 'to_string(42)', '"" + 42', 'str(42)'], a: 1, e: 'Для преобразования числа в строку есть функция to_string. Склейка строки с числом напрямую не работает.' },
{ q: 'Что выведет этот код?', code: 'string s = "abc";\ns += \'d\';\ncout << s.length();', o: ['3', '4', 'abcd', 'Ошибка'], a: 1, e: '+= дописывает символ в конец, длина становится 4.' },
{ q: 'Чем getline отличается от cin >> s?', o: ['Ничем', 'Читает всю строку, включая пробелы', 'Читает только число', 'Читает один символ'], a: 1, e: 'cin >> s останавливается на пробеле, а getline читает до конца строки.' }
],
m5: [
{ q: 'Какой индекс у первого элемента массива?', o: ['1', '0', '-1', 'Зависит от массива'], a: 1, e: 'В C++ нумерация элементов всегда начинается с нуля.' },
{ q: 'Что выведет этот код?', code: 'vector<int> v(3);\ncout << v[0];', o: ['0', 'Мусор', 'Ошибка', '3'], a: 0, e: 'vector<int> v(3) создаёт три элемента, заполненных нулями.' },
{ q: 'Что будет при обращении к a[5] для int a[5]?', o: ['Вернётся последний элемент', 'Выход за границы — ошибка, поведение неопределённое', 'Вернётся 0', 'Массив увеличится'], a: 1, e: 'Допустимые индексы — от 0 до 4. Выход за границы — частая и опасная ошибка.' },
{ q: 'Что делает ‹v.push_back(7)›?', o: ['Вставляет 7 в начало', 'Добавляет 7 в конец вектора', 'Заменяет все элементы на 7', 'Удаляет число 7'], a: 1, e: 'push_back добавляет новый элемент в конец, размер увеличивается на 1.' },
{ q: 'Как отсортировать vector v по возрастанию?', o: ['sort(v)', 'sort(v.begin(), v.end())', 'v.sort()', 'order(v)'], a: 1, e: 'sort принимает диапазон — начало и конец.' }
],
m6: [
{ q: 'Изменится ли переменная a после вызова f(a)?', code: 'void f(int x) { x = 5; }\n// ...\nint a = 1;\nf(a);', o: ['Да, станет 5', 'Нет, останется 1', 'Ошибка компиляции', 'Станет 0'], a: 1, e: 'Параметр x — копия. Чтобы менять исходную переменную, нужна ссылка: int& x.' },
{ q: 'Что означает ‹int& x› в параметрах функции?', o: ['Адрес числа', 'Ссылка на переменную: функция работает с оригиналом', 'Указатель', 'Константа'], a: 1, e: 'Ссылка — другое имя той же переменной, поэтому изменения видны снаружи.' },
{ q: 'Что обязательно нужно рекурсивной функции, чтобы остановиться?', o: ['Цикл', 'База рекурсии (условие выхода)', 'Глобальная переменная', 'Ключевое слово stop'], a: 1, e: 'Без базового случая функция будет вызывать себя бесконечно — получится переполнение стека.' },
{ q: 'Какой тип результата у функции, которая ничего не возвращает?', o: ['null', 'empty', 'void', 'int'], a: 2, e: 'void означает «без результата».' }
],
m7: [
{ q: 'Как обратиться к полю x структуры p?', o: ['p->x только', 'p.x', 'p[x]', 'p::x'], a: 1, e: 'К полям структуры обращаются через точку.' },
{ q: 'Что делает запись ‹Point p = {1, 2};›?', o: ['Создаёт массив', 'Создаёт Point и задаёт значения его полей по порядку', 'Вызывает функцию', 'Ошибка'], a: 1, e: 'Список в фигурных скобках по порядку заполняет поля структуры.' },
{ q: 'Чем struct удобнее массива?', o: ['Он быстрее', 'Хранит значения разных типов под одним именем', 'Занимает меньше памяти', 'Ничем'], a: 1, e: 'В массиве все элементы одного типа, а в структуре поля могут быть разными: имя, возраст, оценка.' },
{ q: 'Что хранит указатель ‹int* p›?', o: ['Целое число', 'Адрес переменной в памяти', 'Копию переменной', 'Строку'], a: 1, e: 'Указатель — это адрес ячейки памяти. Эту тему стоит изучать после основ.' }
]
};

/* ============================ СПРАВОЧНИК ============================ */
const ref = [
{ t: 'Структура программы', d: 'Минимальный шаблон программы.', code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // код\n    return 0;\n}' },
{ t: 'Вывод: cout', d: 'Через << можно выводить несколько значений. endl или "\\n" — новая строка.', code: 'cout << "a = " << a << endl;\ncout << x << " " << y << "\\n";' },
{ t: 'Ввод: cin и getline', d: 'cin читает слово или число, getline — всю строку с пробелами.', code: 'int a, b;\ncin >> a >> b;\n\nstring line;\ncin.ignore();            // если перед этим был cin >>\ngetline(cin, line);' },
{ t: 'Типы данных', d: 'Основные типы и их назначение.', code: 'int n = 5;            // целое\nlong long big = 1e12; // большое целое\ndouble x = 3.14;      // дробное\nchar c = \'A\';         // символ\nbool ok = true;       // true / false\nstring s = "text";    // строка' },
{ t: 'Операторы', d: 'Арифметика, сравнение, логика.', code: '+  -  *  /  %        // арифметика\n== != < > <= >=      // сравнение\n&& || !              // и, или, не\n+= -= *= /= %=       // сокращения\n++  --               // увеличить / уменьшить на 1' },
{ t: 'if / else', d: 'Ветвление.', code: 'if (a > b) {\n    cout << "a";\n} else if (a == b) {\n    cout << "равны";\n} else {\n    cout << "b";\n}' },
{ t: 'switch', d: 'Выбор по целому числу или символу. Не забывай break.', code: 'switch (x) {\n    case 1: cout << "one"; break;\n    case 2: cout << "two"; break;\n    default: cout << "other";\n}' },
{ t: 'Циклы', d: 'for — известное число повторов, while — пока верно условие.', code: 'for (int i = 0; i < n; i++) { ... }\nwhile (cond) { ... }\ndo { ... } while (cond);\nfor (int x : v) { ... }   // перебор контейнера\nbreak;      // выйти из цикла\ncontinue;   // следующий повтор' },
{ t: 'string', d: 'Работа со строками.', code: 's.size()          // длина\ns[i]               // символ\ns += "abc";        // дописать\ns.substr(p, len)   // подстрока\ns.find("ab")       // позиция или -1\nto_string(42)      // число -> строка\nstoi("42")         // строка -> число' },
{ t: 'Символы', d: 'Функции для char (подключаются через <cctype>, здесь работают сразу).', code: 'isdigit(c)  isalpha(c)  isupper(c)  islower(c)\ntolower(c)  toupper(c)\nc - \'0\'      // цифра как число\nc - \'a\'      // номер буквы' },
{ t: 'Массивы', d: 'Фиксированный размер, нумерация с нуля.', code: 'int a[5] = {1, 2, 3, 4, 5};\nint b[100];            // 100 элементов\nint g[3][4];           // таблица 3x4\na[0] = 10;' },
{ t: 'vector', d: 'Динамический массив. Нужен #include <vector>.', code: 'vector<int> v;          // пустой\nvector<int> w(5, 0);    // 5 нулей\nv.push_back(3);         // в конец\nv.pop_back();           // убрать последний\nv.size()  v.empty()  v.back()  v.clear()\nvector<vector<int>> g(n, vector<int>(m));' },
{ t: 'algorithm', d: 'Готовые алгоритмы. Нужен #include <algorithm>.', code: 'sort(v.begin(), v.end());\nsort(v.begin(), v.end(), greater<int>());\nreverse(v.begin(), v.end());\n*max_element(v.begin(), v.end())\n*min_element(v.begin(), v.end())\nsort(a, a + n);        // обычный массив' },
{ t: 'Математика (cmath)', d: 'Математические функции. Результат чаще всего double.', code: 'sqrt(x)  pow(x, y)  abs(x)\nfloor(x)  ceil(x)  round(x)\nmin(a, b)  max(a, b)\nsin(x)  cos(x)  log(x)' },
{ t: 'Форматирование вывода', d: 'Нужен #include <iomanip>.', code: 'cout << fixed << setprecision(2) << x;  // 3.14\ncout << setw(5) << x;                    // ширина 5\ncout << setfill(\'0\') << setw(3) << 7;   // 007' },
{ t: 'Функции', d: 'Объявляй выше места вызова.', code: 'int add(int a, int b) {\n    return a + b;\n}\n\nvoid hello() {\n    cout << "hi";\n}\n\nvoid inc(int& x) { x++; }          // ссылка\nint sum(const vector<int>& v);     // без копирования' },
{ t: 'struct', d: 'Свой тип с несколькими полями. Объявляется вне функций.', code: 'struct Point {\n    int x, y;\n};\n\nPoint p = {1, 2};\np.x = 5;\nvector<Point> pts;\npts.push_back({3, 4});' },
{ t: 'Частые ошибки', d: 'На что смотреть, если программа не работает.', code: '= вместо ==         if (x = 5)   // присваивание!\nнет ;               cout << a      // ошибка\n7 / 2 даёт 3        нужен 7 / 2.0\nвыход за границы    a[n] при размере n\nstring + число      "a" + 5 нельзя\nдобавь return в функцию с результатом' }
];

const faq = [
{ q: 'Как работает запуск кода в приложении?', a: 'В приложении встроен мини-интерпретатор C++. Он понимает основы языка: переменные, условия, циклы, строки, vector, функции, struct и часть стандартной библиотеки. Это не настоящий компилятор, поэтому сообщения об ошибках могут отличаться от g++.' },
{ q: 'Чего интерпретатор пока не умеет?', a: 'Указатели, классы, шаблоны, map и set, работа с файлами. Рекурсия работает примерно до 600 вложенных вызовов. Для таких тем пользуйся компьютером или онлайн-компилятором.' },
{ q: 'Почему мой вывод не принимается?', a: 'Проверка сравнивает вывод построчно, пробелы в конце строк игнорируются. Нужные слова и регистр букв должны совпадать точно. Лишний текст вроде «Введите число:» тоже считается ошибкой.' },
{ q: 'Как перенести прогресс на другое устройство?', a: 'Профиль → «Резервная копия» → скопируй текст, на другом устройстве вставь его в поле и нажми «Загрузить».' }
];

window.DATA = { modules, quizzes, ref, faq };
})();
