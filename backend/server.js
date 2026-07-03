const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "defaultdb",
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : null
});

db.connect((erro) => {
    if (erro) {
        console.log("Erro ao conectar");
        console.log(erro);
        return;
    }
    console.log("Conectado com sucesso");
    const criarTabelaSQL = `
    CREATE TABLE IF NOT EXISTS alunos(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    sobrenome VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
    );
    `;
    db.query(criarTabelaSQL, (erroTabela) => {
        if (erroTabela) {
            console.log("Erro de verificação ou criação da tabela", erroTabela);
        } else {
            console.log("Tabela pronta para uso");
        }
    });
});

app.get("/", (req, res) => {
    res.send("API rodando!");
});

app.post("/alunos", (req, res) => {
    const { nome, sobrenome, email, telefone } = req.body;

    if (!nome || !sobrenome || !email || !telefone) {
        return res.status(400).json({
            erro: "Preencha todos os campos."
        });
    }
    if (nome.length < 3 || sobrenome.length < 3) {
        return res.status(400).json({
            erro: "O nome e sobrenome deve possuir no mínimo 3 caracteres."
        });
    }

    const verificaSQL = "select * from alunos where email = ?";
    db.query(verificaSQL, [email], (erro, resultado) => {
        if (erro) {
            return res.status(500).json(erro);
        }
        if (resultado.length > 0) {
            return res.status(400).json({
                erro: "Já existe um cadastro com este email!"
            });
        }
        const inserirSQL = `insert into alunos (nome, sobrenome, email, telefone) values(?, ?, ?, ?)`;
        db.query(inserirSQL, [nome, sobrenome, email, telefone], (erro, resultado) => {
            if (erro) {
                return res.status(500).json(erro);
            }
            res.status(201).json({
                mensagem: "Aluno cadastrado",
                id: resultado.insertId
            });
        });
    });
});

app.get("/alunos", (req, res) => {
    db.query("select * from alunos", (erro, resultado) => {
        if (erro) {
            return res.status(500).json(erro);
        }
        res.json(resultado);
    });
});

app.delete("/alunos/:id", (req, res) => {
    const id = req.params.id;
    db.query("delete from alunos where id = ?", [id], (erro, resultado) => {
        if (erro) {
            return res.status(500).json(erro);
        }
        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Aluno não encontrado"
            });
        }
        res.json({
            mensagem: "Aluno removido"
        });
    });
});

app.put("/alunos/:id", (req, res) => {
    const id = req.params.id;
    db.query("select ativo from alunos where id = ?", [id], (erro, resultado) => {
        if (erro) {
            return res.status(500).json(erro);
        }
        if (resultado.length === 0) {
            return res.status(404).json({
                erro: "Aluno não encontrado"
            });
        }
        const novoStatus = resultado[0].ativo ? 0 : 1;
        db.query("update alunos set ativo = ? where id = ?", [novoStatus, id], (erro) => {
            if (erro) {
                return res.status(500).json(erro);
            }
            res.json({
                mensagem: "Aluno atualizado"
            });
        });
    });
});

let incorretas = 0;
let bloqueado = false;

app.post("/admin", (req, res) => {
    const { email, senha } = req.body;

    if (bloqueado === true) {
        return res.status(403).json({
            erro: "Tentativas excedidas."
        });
    }
    if (!email || !senha) {
        return res.status(400).json({
            erro: "Informe email e senha."
        });
    }

    const verificaAdminSQL = "select * from administradores where email = ? and senha = ?";
    db.query(verificaAdminSQL, [email, senha], (erro, resultado) => {
        if (erro) {
            return res.status(500).json(erro);
        }

        if (resultado.length === 0) {
            incorretas++;
            if (incorretas >= 3) {
                bloqueado = true;
                return res.status(403).json({
                    erro: "Sistema bloqueado."
                });
            }
            return res.status(401).json({
                erro: "Credenciais inválidas."
            });
        }

        incorretas = 0;
        res.json({ autenticado: true });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Servidor rodando em: ");
    console.log(`porta ${PORT}`);
});