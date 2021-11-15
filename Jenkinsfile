node {
    label 'test'
    def kibanaVersion = '6.5.4'
    def scmVars = checkout scm
    sh "env"
    def imageName = "test-image:${env.BUILD_ID}"
    def testImage

    stage('Build container image') {
        sh 'ls -l'
        sh 'docker -v'
        testImage = docker.build imageName
    }

    try {
        testImage.inside {
            sh 'uname -a'
            env.NODE_OPTIONS = '--max_old_space_size=8192'
            env.TEST_BROWSER_HEADLESS=1
            env.KIBANA_DIR=sh(script: 'pwd', , returnStdout: true).trim()
            sh 'which npm'
            sh 'npm --version'
            sh 'rm -rf target/junit'
            sh 'rm -rf junit-test'
            sh 'mkdir junit-test'

            stage('Bootstrap') {
                sh 'yarn add --dev jest-junit@10.0.0'
                sh 'google-chrome --version'
                sh 'yarn kbn bootstrap'
            }

            stage('Unit Test') {
                echo "Start Unit Tests"
                def utResult = sh returnStatus: true, script: 'CI=1 GCS_UPLOAD_PREFIX=fake node scripts/jest -u --ci'

                if (utResult != 0) {
                    currentBuild.result = 'FAILURE'
                }
                
                junit 'target/junit/TEST-Jest Tests*.xml'
            }
        }
    } catch (e) {
        echo 'This will run only if failed'
        currentBuild.result = 'FAILURE'
        throw e
    }
}