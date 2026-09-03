"""
Pegasus Store CMS — локальный менеджер товаров поверх Supabase.

Товары хранятся в таблице `products` (Supabase Postgres), фото — в публичном
бакете `product-images` (Supabase Storage). Приложение работает напрямую с
REST API Supabase; локальный products.json больше не используется.

Зависимости:  pip install requests

Настройки читаются из файла `.env` рядом со скриптом (или из переменных
окружения):
  VITE_SUPABASE_URL    — Project URL (Supabase Dashboard → Settings → API)
  SUPABASE_SERVICE_KEY — service_role ключ (тот же экран). НИКОГДА не
                         публикуйте его и не кладите в переменные VITE_*.
"""

import os
import re
import time
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from urllib.parse import quote

import requests

# Бакет в Supabase Storage, куда загружаются фото товаров.
STORAGE_BUCKET = 'product-images'

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

# Транслитерация: имена объектов в Storage остаются латиницей, иначе пути
# ломаются на регистрозависимых хостингах и в URL.
TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
}


def slugify(text):
    """Превращает произвольную строку в безопасный для файловой системы slug."""
    result = ''.join(TRANSLIT.get(ch, ch) for ch in str(text).lower())
    result = re.sub(r'[^a-z0-9]+', '-', result)
    return result.strip('-') or 'item'


# --- Конфигурация ---------------------------------------------------------

def read_dotenv():
    """Читает файл .env (KEY=VALUE). Значения из окружения имеют приоритет."""
    env = {}
    dotenv_path = os.path.join(PROJECT_ROOT, '.env')
    try:
        with open(dotenv_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, _, value = line.partition('=')
                env[key.strip()] = value.strip().strip('"').strip("'")
    except OSError:
        pass
    return env


def load_config():
    dotenv = read_dotenv()
    return {
        'url': (os.environ.get('VITE_SUPABASE_URL') or dotenv.get('VITE_SUPABASE_URL') or '').rstrip('/'),
        'service_key': (os.environ.get('SUPABASE_SERVICE_KEY')
                        or dotenv.get('SUPABASE_SERVICE_KEY') or ''),
    }


# --- Supabase REST API ------------------------------------------------------

def _headers(config):
    return {
        'apikey': config['service_key'],
        'Authorization': f"Bearer {config['service_key']}",
        'Content-Type': 'application/json',
    }


# Соответствие ключей products.json ↔ колонок таблицы products.
KEY_MAP = {
    'avitoLink': 'avito_link',
    'isNew': 'is_new',
    'isBestseller': 'is_bestseller',
    'inStock': 'in_stock',
}


def from_db(row):
    """snake_case (строка из БД) → camelCase, привычный остальному коду."""
    reverse = {value: key for key, value in KEY_MAP.items()}
    return {reverse.get(key, key): value for key, value in row.items()}


def fetch_products(config):
    """Возвращает список товаров в camelCase. Порядок — как на витрине."""
    resp = requests.get(
        f"{config['url']}/rest/v1/products",
        params={'select': '*', 'order': 'sort_order.asc,id.asc'},
        headers=_headers(config),
        timeout=20,
    )
    resp.raise_for_status()
    return [from_db(row) for row in resp.json()]


def insert_product(config, payload):
    resp = requests.post(
        f"{config['url']}/rest/v1/products",
        json=payload,
        headers=_headers(config),
        timeout=20,
    )
    resp.raise_for_status()


def update_product(config, product_id, payload):
    resp = requests.patch(
        f"{config['url']}/rest/v1/products?id=eq.{quote(str(product_id))}",
        json=payload,
        headers=_headers(config),
        timeout=20,
    )
    resp.raise_for_status()


def delete_product_row(config, product_id):
    resp = requests.delete(
        f"{config['url']}/rest/v1/products?id=eq.{quote(str(product_id))}",
        headers=_headers(config),
        timeout=20,
    )
    resp.raise_for_status()


# --- Supabase Storage (фото) ------------------------------------------------

_MIME = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
}


def upload_image(config, local_path, category):
    """Загружает фото в бакет product-images и возвращает его публичный URL."""
    ext = os.path.splitext(local_path)[1].lower()
    ext = ext if ext in _MIME else '.jpg'
    stem = os.path.splitext(os.path.basename(local_path))[0]
    # Префикс из категории + timestamp: ключи не пересекаются между товарами.
    key = f"{slugify(category) or 'raznoe'}/{slugify(stem)}-{int(time.time())}{ext}"

    with open(local_path, 'rb') as fh:
        data = fh.read()

    headers = {
        'apikey': config['service_key'],
        'Authorization': f"Bearer {config['service_key']}",
        'Content-Type': _MIME[ext],
    }
    resp = requests.post(
        f"{config['url']}/storage/v1/object/{STORAGE_BUCKET}/{key}",
        data=data,
        headers=headers,
        timeout=120,
    )
    resp.raise_for_status()
    return f"{config['url']}/storage/v1/object/public/{STORAGE_BUCKET}/{key}"


def delete_image(config, image_url):
    """Удаляет объект из бакета, если URL указывает на него (best effort)."""
    prefix = f"{config['url']}/storage/v1/object/public/{STORAGE_BUCKET}/"
    if not image_url.startswith(prefix):
        # Локальные пути (assets/...) из старой схемы не трогаем.
        return
    key = image_url.split(prefix, 1)[1]
    # DELETE /object/{bucket}/{key} — удаление одного объекта. Не используем
    # POST /object/{bucket}/remove: на новых версиях Supabase Storage этот путь
    # трактуется как загрузка файла с именем «remove», и объект не удаляется.
    headers = {
        'apikey': config['service_key'],
        'Authorization': f"Bearer {config['service_key']}",
    }
    resp = requests.delete(
        f"{config['url']}/storage/v1/object/{STORAGE_BUCKET}/{key}",
        headers=headers,
        timeout=20,
    )
    resp.raise_for_status()


# --- Приложение --------------------------------------------------------------

class PegasusAdminApp:
    def __init__(self, root, config):
        self.root = root
        self.config = config
        self.root.title("Pegasus Store — CMS (Система управления)")
        self.root.geometry("1100x700") # Слегка увеличили высоту окна для нового поля
        self.root.configure(padx=15, pady=15)

        self.selected_image_path = None
        self.editing_id = None
        self.products_data = []

        self.create_widgets()
        self.load_products()

    def create_widgets(self):
        # Стиль для_Treeview: увеличиваем высоту строк, чтобы текст не обрезался
        style = ttk.Style()
        style.configure("Treeview", rowheight=30, font=("Arial", 10))
        style.configure("Treeview.Heading", font=("Arial", 10, "bold"))

        # Разделяем экран на две части: левая (форма) и правая (дерево)
        left_frame = ttk.Frame(self.root, width=400)
        left_frame.pack(side="left", fill="y", padx=(0, 15))

        right_frame = ttk.Frame(self.root)
        right_frame.pack(side="right", fill="both", expand=True)

        # --- ЛЕВАЯ ЧАСТЬ (ФОРМА) ---
        self.form_title = ttk.Label(left_frame, text="✨ Добавление нового товара", font=("Arial", 14, "bold"))
        self.form_title.pack(anchor="w", pady=(0, 15))

        ttk.Label(left_frame, text="Название товара:").pack(anchor="w")
        self.name_entry = ttk.Entry(left_frame, width=50)
        self.name_entry.pack(fill="x", pady=(0, 10))

        ttk.Label(left_frame, text="Цена (₽):").pack(anchor="w")
        self.price_entry = ttk.Entry(left_frame, width=50)
        self.price_entry.pack(fill="x", pady=(0, 10))

        ttk.Label(left_frame, text="Категория (Главная):").pack(anchor="w")
        self.category_entry = ttk.Entry(left_frame, width=50)
        self.category_entry.pack(fill="x", pady=(0, 10))

        ttk.Label(left_frame, text="Подкатегория (Модель/Тип):").pack(anchor="w")
        self.subcategory_entry = ttk.Entry(left_frame, width=50)
        self.subcategory_entry.pack(fill="x", pady=(0, 10))

        # НОВОЕ ПОЛЕ: Ссылка на Авито
        ttk.Label(left_frame, text="Ссылка на Авито:").pack(anchor="w")
        self.avito_entry = ttk.Entry(left_frame, width=50)
        self.avito_entry.pack(fill="x", pady=(0, 10))

        ttk.Label(left_frame, text="Описание (для карточки и SEO):").pack(anchor="w")
        self.desc_text = tk.Text(left_frame, height=3, width=50, font=("Arial", 10))
        self.desc_text.pack(fill="x", pady=(0, 10))

        flags_frame = ttk.Frame(left_frame)
        flags_frame.pack(fill="x", pady=(0, 10))
        self.is_new_var = tk.BooleanVar()
        self.is_best_var = tk.BooleanVar()
        ttk.Checkbutton(flags_frame, text="Новинка", variable=self.is_new_var).pack(side="left")
        ttk.Checkbutton(flags_frame, text="Показывать в «Популярное»",
                        variable=self.is_best_var).pack(side="left", padx=(15, 0))

        # Наличие товара: если снято — на витрине кнопка «Нет в наличии»
        self.in_stock_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(left_frame, text="В наличии", variable=self.in_stock_var).pack(anchor="w", pady=(0, 10))

        ttk.Label(left_frame, text="Характеристики (Формат -> Разъем: Type-C):").pack(anchor="w")
        self.specs_text = tk.Text(left_frame, height=5, width=50, font=("Arial", 10))
        self.specs_text.pack(fill="x", pady=(0, 15))

        self.img_btn = ttk.Button(left_frame, text="Выбрать новое фото...", command=self.choose_image)
        self.img_btn.pack(fill="x", pady=(0, 5))
        self.img_label = ttk.Label(left_frame, text="Файл не выбран", foreground="gray")
        self.img_label.pack(anchor="w", pady=(0, 15))

        # Кнопки управления формой
        btn_frame = ttk.Frame(left_frame)
        btn_frame.pack(fill="x")

        self.save_btn = ttk.Button(btn_frame, text="СОХРАНИТЬ", command=self.save_product)
        self.save_btn.pack(side="left", fill="x", expand=True, padx=(0, 5))

        self.cancel_btn = ttk.Button(btn_frame, text="ОЧИСТИТЬ ФОРМУ", command=self.reset_form)
        self.cancel_btn.pack(side="right", fill="x", expand=True)

        self.del_btn = ttk.Button(left_frame, text="❌ УДАЛИТЬ ТОВАР", command=self.delete_product)
        self.del_btn.pack(fill="x", pady=(10, 0))

        # --- ПРАВАЯ ЧАСТЬ (ДЕРЕВО ТОВАРОВ + ПОИСК) ---
        right_header = ttk.Frame(right_frame)
        right_header.pack(fill="x", pady=(0, 15))

        ttk.Label(right_header, text="📦 База товаров", font=("Arial", 14, "bold")).pack(side="left")

        self.search_entry = ttk.Entry(right_header, width=30)
        self.search_entry.pack(side="right")
        self.search_entry.bind("<KeyRelease>", self.on_search)
        ttk.Label(right_header, text="🔍 Поиск:").pack(side="right", padx=(0, 5))

        # Строка состояния (загрузка / ошибки Supabase)
        self.status_label = ttk.Label(right_frame, text="")
        self.status_label.pack(side="bottom", anchor="w", pady=(8, 0))

        # Настраиваем таблицу (с деревом для группировки по категориям)
        columns = ("id", "name", "price")
        self.tree = ttk.Treeview(right_frame, columns=columns, show="tree headings", selectmode="browse")
        # tree-колонка — иконка разворачивания/сворачивания + название категории
        self.tree.heading("#0", text="Товар / Категория")
        self.tree.column("#0", width=280)
        self.tree.heading("id", text="ID")
        self.tree.heading("name", text="Название")
        self.tree.heading("price", text="Цена")

        self.tree.column("id", width=50, anchor="center")
        self.tree.column("name", width=200)
        self.tree.column("price", width=80, anchor="e")

        scrollbar = ttk.Scrollbar(right_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.tree.pack(side="left", fill="both", expand=True)

        self.tree.bind("<<TreeviewSelect>>", self.on_item_select)

    def set_status(self, text, error=False):
        self.status_label.config(
            text=text,
            foreground="#b3261e" if error else "#1e7d32",
        )

    def on_search(self, event):
        self.update_tree()

    def load_products(self):
        self.products_data = []
        try:
            self.products_data = fetch_products(self.config)
            self.set_status(f"Supabase: загружено товаров — {len(self.products_data)}")
        except requests.RequestException as e:
            self.set_status("Ошибка подключения к Supabase", error=True)
            messagebox.showerror(
                "Ошибка загрузки",
                f"Не удалось получить товары из Supabase:\n{e}",
            )
        self.update_tree()

    def update_tree(self):
        for item in self.tree.get_children():
            self.tree.delete(item)

        query = self.search_entry.get().lower().strip()

        # Фильтруем товары по поисковому запросу
        filtered = []
        for p in self.products_data:
            name_match = query in p.get("name", "").lower()
            cat_match = query in p.get("category", "").lower()
            sub_match = query in p.get("subcategory", "").lower()
            id_match = query == str(p.get("id"))
            if not query or name_match or cat_match or sub_match or id_match:
                filtered.append(p)

        # Группируем по категориям (1C-стиль)
        categories = {}
        for p in filtered:
            cat = p.get("category", "Без категории")
            categories.setdefault(cat, []).append(p)

        # Сортируем категории по алфавиту
        for cat in sorted(categories.keys()):
            products = categories[cat]
            # Вставляем родительский узел-категорию
            cat_id = self.tree.insert(
                "", "end",
                text=f"\U0001f4c1 {cat}  ({len(products)})",
                open=True,
                values=("", "", "")
            )
            # Вставляем товары как дочерние узлы
            for p in products:
                self.tree.insert(
                    cat_id, "end",
                    text=f"  {p.get('name', '')}",
                    values=(
                        p.get("id"),
                        p.get("subcategory", ""),
                        f"{p.get('price', 0)} ₽"
                    )
                )

    def choose_image(self):
        file_path = filedialog.askopenfilename(
            title="Выберите фото товара",
            filetypes=[("Image Files", "*.jpg *.jpeg *.png *.webp")]
        )
        if file_path:
            self.selected_image_path = file_path
            self.img_label.config(text=f"Выбрано: {os.path.basename(file_path)} (загрузится в Supabase)", foreground="green")

    def on_item_select(self, event):
        selected = self.tree.selection()
        if not selected:
            return

        item = selected[0]
        parent = self.tree.parent(item)

        # Если выбран родительский узел (категория) — ничего не делаем
        if not parent:
            return

        item_values = self.tree.item(item, "values")
        # ID хранится как строка: в базе могут быть и числа, и строки.
        product_id = str(item_values[0])

        # Умное сравнение — строка к строке, чтобы строковые ID не ломались
        product = next((p for p in self.products_data if str(p.get("id")) == product_id), None)
        if not product:
            return

        self.editing_id = product_id
        self.form_title.config(text=f"✏️ Редактирование товара ID: {product_id}", foreground="blue")

        # Заполняем поля
        self.name_entry.delete(0, tk.END)
        self.name_entry.insert(0, product.get("name", ""))

        self.price_entry.delete(0, tk.END)
        self.price_entry.insert(0, str(product.get("price", "")))

        self.category_entry.delete(0, tk.END)
        self.category_entry.insert(0, product.get("category", ""))

        self.subcategory_entry.delete(0, tk.END)
        self.subcategory_entry.insert(0, product.get("subcategory", ""))

        # Подтягиваем ссылку на Авито
        self.avito_entry.delete(0, tk.END)
        self.avito_entry.insert(0, product.get("avitoLink", ""))

        self.desc_text.delete("1.0", tk.END)
        self.desc_text.insert("1.0", product.get("description", ""))
        self.is_new_var.set(bool(product.get("isNew")))
        self.is_best_var.set(bool(product.get("isBestseller")))
        # По умолчанию товар в наличии; колонки может не быть у старых записей.
        self.in_stock_var.set(bool(product.get("inStock", True)))

        # Загружаем в форму именно `specs`: это полная таблица характеристик
        # на карточке товара. `filters` — подмножество для сайдбара каталога.
        # Раньше поле читало только `filters`, поэтому правка товара
        # безвозвратно обрезала таблицу характеристик.
        self.specs_text.delete("1.0", tk.END)
        specs = product.get("specs") or product.get("filters") or {}
        for key, val in specs.items():
            self.specs_text.insert(tk.END, f"{key}: {val}\n")

        self.selected_image_path = None
        current_image = product.get("images", [""])[0] if product.get("images") else ""
        self.img_label.config(
            text=f"Текущее фото: {os.path.basename(current_image)} (оставьте, чтобы не менять)",
            foreground="gray",
        )

    def reset_form(self):
        self.editing_id = None
        self.form_title.config(text="✨ Добавление нового товара", foreground="black")
        self.name_entry.delete(0, tk.END)
        self.price_entry.delete(0, tk.END)
        self.category_entry.delete(0, tk.END)
        self.subcategory_entry.delete(0, tk.END)
        self.avito_entry.delete(0, tk.END) # Очищаем Авито
        self.desc_text.delete("1.0", tk.END)
        self.is_new_var.set(False)
        self.is_best_var.set(False)
        self.in_stock_var.set(True)
        self.specs_text.delete("1.0", tk.END)
        self.selected_image_path = None
        self.img_label.config(text="Файл не выбран", foreground="gray")

        for item in self.tree.selection():
            self.tree.selection_remove(item)

    def delete_product(self):
        if not self.editing_id:
            messagebox.showwarning("Внимание", "Сначала выберите товар в таблице справа для удаления.")
            return

        product = next(
            (p for p in self.products_data if str(p.get("id")) == str(self.editing_id)),
            None,
        )
        if not product:
            return

        if messagebox.askyesno("Подтверждение", "Вы точно хотите удалить этот товар из базы?"):
            try:
                delete_product_row(self.config, self.editing_id)
            except requests.RequestException as e:
                messagebox.showerror("Ошибка удаления", f"Supabase: {e}")
                return

            # Best effort: убираем фото товара из Storage (если оно там лежит)
            for image_url in product.get("images") or []:
                try:
                    delete_image(self.config, image_url)
                except requests.RequestException:
                    pass

            self.load_products()
            self.reset_form()
            messagebox.showinfo("Успех", "Товар успешно удален!")

    def save_product(self):
        name = self.name_entry.get().strip()
        price_str = self.price_entry.get().strip()
        category = self.category_entry.get().strip()
        subcategory = self.subcategory_entry.get().strip()
        avito_url = self.avito_entry.get().strip() # Читаем ссылку
        description = self.desc_text.get("1.0", tk.END).strip()
        is_new = bool(self.is_new_var.get())
        is_best = bool(self.is_best_var.get())
        is_in_stock = bool(self.in_stock_var.get())
        specs_raw = self.specs_text.get("1.0", tk.END).strip()

        if not name or not price_str or not category:
            messagebox.showerror("Ошибка", "Заполните обязательные поля (Название, Цена, Категория)!")
            return

        try:
            price = int(price_str)
        except ValueError:
            messagebox.showerror("Ошибка", "Цена должна быть числом!")
            return

        if not self.editing_id and not self.selected_image_path:
            messagebox.showerror("Ошибка", "Для нового товара обязательно выберите фото!")
            return

        filters_dict = {}
        if specs_raw:
            for line in specs_raw.split('\n'):
                if ':' in line:
                    key, val = line.split(':', 1)
                    filters_dict[key.strip()] = val.strip()

        old_images = []
        if self.editing_id:
            current = next(
                (p for p in self.products_data if str(p.get("id")) == str(self.editing_id)),
                None,
            )
            if current:
                old_images = list(current.get("images") or [])

        # Новое фото → загружаем в Supabase Storage, получаем публичный URL
        new_image_url = None
        if self.selected_image_path:
            try:
                new_image_url = upload_image(self.config, self.selected_image_path, category)
            except (requests.RequestException, OSError) as e:
                messagebox.showerror("Ошибка", f"Не удалось загрузить фото в Supabase Storage:\n{e}")
                return

        # Поля пишем в колонки таблицы (snake_case). filters и specs — это
        # одна и та же таблица «Характеристики» из формы: обе обновляются.
        payload = {
            "name": name,
            "price": price,
            "category": category,
            "subcategory": subcategory,
            "description": description,
            "is_new": is_new,
            "is_bestseller": is_best,
            "in_stock": is_in_stock,
            "avito_link": avito_url,
            "filters": filters_dict,
            "specs": filters_dict,
        }
        if new_image_url:
            payload["images"] = [new_image_url]

        try:
            if self.editing_id:
                update_product(self.config, self.editing_id, payload)
                msg = f"Товар '{name}' успешно обновлен!"
            else:
                insert_product(self.config, payload)
                msg = f"Товар '{name}' успешно добавлен!"
        except requests.RequestException as e:
            messagebox.showerror("Ошибка сохранения", f"Supabase: {e}")
            return

        # Только после успешной записи в БД удаляем старую фотографию
        if new_image_url:
            for image_url in old_images:
                try:
                    delete_image(self.config, image_url)
                except requests.RequestException:
                    pass

        self.load_products()
        self.reset_form()
        messagebox.showinfo("Успех", msg)


def main():
    config = load_config()
    root = tk.Tk()

    if not config['url'] or not config['service_key']:
        root.withdraw()
        messagebox.showerror(
            "Supabase не настроен",
            "Добавьте в файл .env рядом с manager.py:\n\n"
            "  VITE_SUPABASE_URL=https://<project>.supabase.co\n"
            "  SUPABASE_SERVICE_KEY=<service_role ключ из Settings → API>\n\n"
            "service_role-ключ нужен для записи в таблицу и загрузки фото. "
            "Не публикуйте его и не используйте в коде витрины.",
        )
        root.destroy()
        return

    app = PegasusAdminApp(root, config)
    root.mainloop()


if __name__ == "__main__":
    main()
