// Configurar el job como Pipeline desde SCM para que checkout scm use este repositorio.
// Requiere un agente Unix con Git, Node.js 22.13+ (rama 22) o 24+, npm y Python 3 en PATH.
// Backend/API: habilitar tests solo con una base de prueba o un entorno separado,
// configurado para no acceder a la base real; importar app puede escribir datos.
pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    environment {
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verificar versiones') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'python3 --version'
            }
        }

        stage('Instalar dependencias frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci --include=dev'
                }
            }
        }

        stage('Tests frontend') {
            steps {
                dir('frontend') {
                    sh 'npm test'
                }
            }
        }

        stage('Build frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Archivar frontend') {
            steps {
                archiveArtifacts artifacts: 'frontend/dist/**', allowEmptyArchive: false
            }
        }
    }
}
