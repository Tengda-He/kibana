node {
    label 'test'
    def kibanaVersion = '7.7.1'
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
                sh 'yarn add --dev jest-junit'
                sh 'google-chrome --version'
                sh 'yarn kbn bootstrap'
            }

            stage('Build test plugins') {
                sh """
                    echo " -> building kibana platform plugins"
                    node scripts/build_kibana_platform_plugins \\
                        --oss \\
                        --no-examples \\
                        --scan-dir "$env.KIBANA_DIR/test/plugin_functional/plugins" \\
                        --workers 6 \\
                        --verbose
                    """
            }

            stage('Unit Test') {
                echo "Starting unit test..."
                def utResult = sh returnStatus: true, script: 'CI=1 GCS_UPLOAD_PREFIX=fake yarn test:jest -u --ci'

                if (utResult != 0) {
                    currentBuild.result = 'FAILURE'
                }

                junit 'target/junit/TEST-Jest Tests*.xml'
            }

            stage('Plugin Functional Test') {
                currentBuild.result = 'Success'
                echo "Start Plugin Functional Test"
                echo "TEST_BROWSER_HEADLESS $env.TEST_BROWSER_HEADLESS"
                echo "NODE_OPTIONS $env.NODE_OPTIONS"


                def pluginFtrResult = sh returnStatus: true, script: "CI=1 GCS_UPLOAD_PREFIX=fake node scripts/functional_tests.js --config test/plugin_functional/config.js"
                
                if (pluginFtrResult != 0) {
                    currentBuild.result = 'FAILURE'
                }
                junit 'target/junit/TEST-Plugin Functional Tests*.xml'
            }
        }
    } catch (e) {
            echo 'This will run only if failed'
            currentBuild.result = 'FAILURE'
            throw e
    } 
}