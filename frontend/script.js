const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:3000" : "https://upi-senac.onrender.com";

const imagem = document.getElementById("imagem");

let imagens = ["fotos/imagem_teste_proporcao1.jpg", "fotos/imagem_teste_proporcao2.jpg", "fotos/imagem_teste_proporcao3.jpg", "fotos/imagem_teste_proporcao4.jpg", "fotos/imagem_teste_proporcao5.jpg", "fotos/imagem_teste_proporcao6.jpg", "fotos/imagem_teste_proporcao7.jpg"];
let indice = 0;

if (imagem) {
    imagem.style.transform = "scale(1.075)";

    // zoom da primeira imagem
    imagem.style.transition = "transform 8s linear";
    imagem.style.transform = "scale(1.08)";

    setInterval(imagemProxima, 8000);
}

function imagemProxima(){

    indice++;

    if(indice >= imagens.length){
        indice = 0;
    }

    // troca instantânea
    imagem.src = imagens[indice];

    // volta ao tamanho normal
    imagem.style.transition = "none";
    imagem.style.transform = "scale(1)";

    // força o navegador a aplicar o scale(1)
    void imagem.offsetWidth;

    // inicia o zoom novamente
    imagem.style.transition = "transform 8s linear";
    imagem.style.transform = "scale(1.08)";
}

/*------------------------------------------------------------------------------------------------------------------------*/

// Funções JavaScript:

function mostrarSenha() {
    let senha = document.getElementById("senha");
    let olho = document.getElementById("olho");
    if (senha.type === "password") {
        senha.type = "text";
        olho.textContent = "🙈";
    } else {
        senha.type = "password";
        olho.textContent = "👁️";
    }
}

const telefone = document.getElementById("telefone");
if (telefone) {
    telefone.addEventListener("input", () => {
        let valor = telefone.value.replace(/\D/g, "");
        if(valor.length <= 11){
            valor = valor.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/,"($1) $2 $3-$4");
        }
        telefone.value = valor;
    });
}

async function login() {
    try {
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        const resposta = await fetch(`${API}/admin`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if(dados.autenticado){
            sessionStorage.setItem("admin_logado", "true");
            window.location.href = "admin.html";
        } else {
            alert(dados.erro || "Email ou senha incorretos!");
        }
    } catch (erro) {
        console.log(erro);
        alert("Erro ao conectar com o servidor.");
    }
}

/*---------------------------------------------------------------------------------------------------------*/

async function cadastrar(event) {

    event.preventDefault();
    const nome = document.getElementById("nome").value;
    const sobrenome = document.getElementById("sobrenome").value;
    const email = document.getElementById("email").value;
    const telefone = document.getElementById("telefone").value;

    const novoCadastro = {
        nome,
        sobrenome,
        email,
        telefone
    };

    try {
        const resposta = await fetch(
            `${API}/alunos`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(novoCadastro)
            });

        const dados = await resposta.json();
        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }
        alert("Cadastro realizado com sucesso.");
        document
            .getElementById("formcadastro")
            .reset();

    } catch (erro) {
        console.log(erro);
    }
}

function verificar() {
    const conteudo = document.getElementById("conteudo");
    if (!conteudo) return;

    if (sessionStorage.getItem("admin_logado") === "true") {
        conteudo.style.display = "flex";
        carregarCadastros();
    } else {
        window.location.href = "login.html";
    }
}

function logoutAdmin() {
    sessionStorage.removeItem(
        "admin_logado"
    );
    window.location.reload();
}

async function carregarCadastros() {
    const resposta = await fetch(
        `${API}/alunos`
    );

    const cadastros = await resposta.json();
    const lista =
        document.getElementById("listaCadastros");
    if (!lista) return;

    lista.innerHTML = "";
    cadastros.forEach(cadastro => {
        lista.innerHTML += `
        <div class="cardCadastro">
            <h3>${cadastro.nome}</h3>
            <p>Sobrenome: ${cadastro.sobrenome}</p>
            <p>Email: ${cadastro.email}</p>
            <p>Telefone: ${cadastro.telefone}</p>
            <p>Status:
                ${cadastro.ativo ? "Ativo" : "Inativo"}
            </p>
            <button onclick="alterarStatus(${cadastro.id})">
                Ativar/Desativar
            </button>
            <button onclick="removerCadastro(${cadastro.id})">
                Remover
            </button>
        </div>
        `;
    });
}

async function removerCadastro(id) {
    await fetch(
        `${API}/alunos/${id}`,
        {
            method: "DELETE"
        });
    carregarCadastros();
}

async function alterarStatus(id) {
    await fetch(
        `${API}/alunos/${id}`,
        {
            method: "PUT"
        });
    carregarCadastros();
}

verificar();