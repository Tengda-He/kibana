node('test') {
    def kibanaVersion = '7.7.1'
    def scmVars = checkout scm
    sh "env"
    def imageName = "${env.BRANCH_NAME}-test-image:${env.BUILD_ID}"
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

            // stage('Unit Test') {
            //     echo "Starting unit test..."
            //     def utResult = sh returnStatus: true, script: 'CI=1 GCS_UPLOAD_PREFIX=fake yarn test:jest -u --ci'

            //     if (utResult != 0) {
            //         currentBuild.result = 'FAILURE'
            //     }

            //     junit 'target/junit/TEST-Jest Tests*.xml'
            // }

            // stage('Integration Test') {
            //     echo "Start Integration Tests"
            //     def itResult = sh returnStatus: true, script: 'CI=1 GCS_UPLOAD_PREFIX=fake yarn test:jest_integration -u --ci'

            //     if (itResult != 0) {
            //         currentBuild.result = 'FAILURE'
            //     }

            //     junit 'target/junit/TEST-Jest Integration Tests*.xml'
            // }

            // stage('Plugin Functional Test') {
            //     currentBuild.result = 'Success'
            //     echo "Start Plugin Functional Test"
            //     echo "TEST_BROWSER_HEADLESS $env.TEST_BROWSER_HEADLESS"
            //     echo "NODE_OPTIONS $env.NODE_OPTIONS"

            //     def pluginFtrResult = sh returnStatus: true, script: "CI=1 GCS_UPLOAD_PREFIX=fake node scripts/functional_tests.js --config test/plugin_functional/config.js"

            //     if (pluginFtrResult != 0) {
            //         currentBuild.result = 'FAILURE'
            //     }

            //     junit 'target/junit/TEST-Plugin Functional Tests*.xml'
            // }
        }
        stage('Functional Test') {
            echo "Starting functional test..."
            functionalDynamicParallelSteps(testImage);
            junit 'target/junit/ci*/**.xml'
        }
    } catch (e) {
            echo 'This will run only if failed'
            junit 'target/junit/**/*.xml'
            currentBuild.result = 'FAILURE'
            throw e
    } 
}

def functionalDynamicParallelSteps(image){
    ciGroupsMap = [:]
    for (int i = 1; i <= 12; i++) {
        def currentCiGroup = "ciGroup${i}";
        def currentStep = i;
        ciGroupsMap["${currentCiGroup}"] = {
            sh "rm -rf ${env.WORKSPACE}_${currentCiGroup}"
            sh "mkdir -p ${env.WORKSPACE}_${currentCiGroup}"
            stage("${currentCiGroup}") {
                withEnv([
                    "TEST_BROWSER_HEADLESS=1",
                    "CI=1",
                    "CI_GROUP=${currentCiGroup}",
                    "GCS_UPLOAD_PREFIX=fake",
                    "TEST_KIBANA_HOST=localhost",
                    "TEST_KIBANA_PORT=6610",
                    "TEST_ES_TRANSPORT_PORT=9403",
                    "TEST_ES_PORT=9400",
                    "CI_PARALLEL_PROCESS_NUMBER=${currentStep}",
                    "JOB=ci${currentStep}",
                    "CACHE_DIR=${currentCiGroup}"
                ]) {
                    image.inside("-v \'${env.WORKSPACE}_${currentCiGroup}:${env.WORKSPACE}/optimize\'") {
                        sh "node scripts/functional_tests.js --config test/functional/config.js --include ${currentCiGroup}"
                    }
                }
                sh "rm -rf ${env.WORKSPACE}_${currentCiGroup}"
            }
        }
    }
    parallel ciGroupsMap
}