---
tags:
  - planners
cssclasses:
  - dashboard
  - noyaml
image: data:image/gif;base64,R0lGODlhMAAMAIAAAAxBd////yH/C05FVFNDQVBFMi4wAwEAAAAh+QQECgAAACwAAAAAMAAMAAACJYSPqcvtD6MKstpLr24Z9A2GYvJ544mhXQmxoesElIyCcB3dRgEAIfkEBAoAAAAsAQACAC0ACgAAAiGEj6nLHG0enNQdWbPefOHYhSLydVhJoSYXPO04qrAmJwUAIfkEBAoAAAAsBQABACkACwAAAiGEj6nLwQ8jcC5ViW3evHt1GaE0flxpphn6BNTEqvI8dQUAIfkEBAoAAAAsAQABACoACwAAAiGEj6nLwQ+jcU5VidPNvPtvad0GfmSJeicUUECbxnK0RgUAIfkEBAoAAAAsAAAAACcADAAAAiCEj6mbwQ+ji5QGd6t+c/v2hZzYiVpXmuoKIikLm6hXAAAh+QQECgAAACwAAAAALQAMAAACI4SPqQvBD6NysloTXL480g4uX0iW1Wg21oem7ismLUy/LFwAACH5BAQKAAAALAkAAAAkAAwAAAIghI8Joe0Po0yBWTaz3g/z7UXhMX7kYmplmo0rC8cyUgAAIfkEBAoAAAAsBQAAACUACgAAAh2Ejwmh7Q+jbIFZNrPeEXPudU74IVa5kSiYqOtRAAAh+QQECgAAACwEAAAAIgAKAAACHISPELfpD6OcqTGKs4bWRp+B36YFi0mGaVmtWQEAIfkEBAoAAAAsAAAAACMACgAAAh2EjxC36Q+jnK8xirOW1kavgd+2BYtJhmnpiGtUAAAh+QQECgAAACwAAAAALgALAAACIYSPqcvtD+MKicqLn82c7e6BIhZQ5jem6oVKbfdqQLzKBQAh+QQECgAAACwCAAIALAAJAAACHQx+hsvtD2OStDplKc68r2CEm0eW5uSN6aqe1lgAADs=
monday-break: "[[Test Breakfast]]"
monday-lunch: "[[Kielbasa with Peppers and Potatoes]]"
monday-dinner: "[[Kielbasa with Peppers and Potatoes]]"
tuesday-break: "[[Test Breakfast]]"
tuesday-lunch: "[[Protein Powerhouse Baked Oatmeal]]"
tuesday-dinner: "[[Baked Salmon Fillets Dijon]]"
wednesday-break: "[[Pumpkin Waffles]]"
wednesday-lunch: "[[Sarah's Easy Shredded Chicken Taco Filling]]"
wednesday-dinner: "[[Kielbasa with Peppers and Potatoes]]"
thursday-break: "[[Test Breakfast]]"
thursday-lunch: "[[Roast Beef Horseradish Roll-Ups]]"
thursday-dinner: "[[Grilled Chicken with Rosemary and Bacon]]"
friday-break: "[[Make-Ahead Freezer Breakfast Burritos]]"
friday-lunch: "[[Roast Beef Horseradish Roll-Ups]]"
friday-dinner: "[[A Good and Easy Garlic Chicken]]"
saturday-break: "[[Freezer Breakfast Sandwiches]]"
saturday-lunch: "[[A Good and Easy Garlic Chicken]]"
saturday-dinner: "[[Baked Salmon Fillets Dijon]]"
sunday-break: "[[Freezer Breakfast Sandwiches]]"
sunday-lunch: "[[A Good and Easy Garlic Chicken]]"
sunday-dinner: "[[Roast Beef Horseradish Roll-Ups]]"
---

```datacorejsx
const script = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-mealPlanner.jsx"));
return function View() { return script.Func(); }
```

---

## 🛍️ Shopping List

```datacorejsx
const script = await dc.require(dc.fileLink("System/Scripts/Widgets/dc-shoppingList.jsx"));
return function View() { return script.Func(); }
```

---

![[Recipes.base]]

---

![[Meal Plans.base]]

---

<a href='https://ko-fi.com/M4M11S2NNW' target='_blank'><img height='36' width ='108' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
