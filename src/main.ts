import { mountApp } from "./ui/app.ts";
import "./style.css";

const root = document.getElementById("app");
if (!root) throw new Error("missing #app");
void mountApp(root);
