import pandas as pd
import json

def parse_mess_menu(file_path):
    df = pd.read_excel(file_path, header=None)
    menu_data = {}
    num_columns = df.shape[1]
    for col in range(num_columns):
        date_key = str(df.iloc[1, col]).strip()
        menu_data[date_key] = {
            "Breakfast": [],
            "Lunch": [],
            "Dinner": []
        }
        breakfast_items = []
        for row in range(3, 12):
            cell = df.iloc[row, col]
            if pd.notna(cell):
                item = str(cell).strip()
                if "********" not in item:
                    breakfast_items.append(item)
        menu_data[date_key]["Breakfast"] = breakfast_items
        lunch_items = []
        for row in range(14, 22):
            cell = df.iloc[row, col]
            if pd.notna(cell):
                item = str(cell).strip()
                if "********" not in item:
                    lunch_items.append(item)
        menu_data[date_key]["Lunch"] = lunch_items
        dinner_items = []
        for row in range(24, 31):
            cell = df.iloc[row, col]
            if pd.notna(cell):
                item = str(cell).strip()
                if "********" not in item:
                    dinner_items.append(item)
        menu_data[date_key]["Dinner"] = dinner_items
    return menu_data

if __name__ == "__main__":
    excel_file_path = "mess_menu.xlsx"
    json_file_path = "mess_menu.json"
    menu = parse_mess_menu(excel_file_path)
    with open(json_file_path, "w") as f:
        json.dump(menu, f, indent=4)
    print(f"Mess menu successfully parsed and written to {json_file_path}")
