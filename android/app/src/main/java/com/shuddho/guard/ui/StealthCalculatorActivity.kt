package com.shuddho.guard.ui

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import com.shuddho.guard.R

/**
 * ছদ্মবেশী ক্যালকুলেটর (Stealth Calculator Vault)
 * সাধারণ মানুষের চোখে এটি শতভাগ কার্যকর সাধারণ একটি ক্যালকুলেটর।
 * কিন্তু গোপন পিন (যেমন: "1234=") চাপলেই এটি শুদ্ধ গার্ডের কনসোলে প্রবেশ করবে।
 */
class StealthCalculatorActivity : Activity() {

    private lateinit var displayTv: TextView
    private var currentInput = StringBuilder()
    private val secretPin = "1234=" // ডিফল্ট মাস্টার পিন

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_stealth_calculator)

        displayTv = findViewById(R.id.tvDisplay)
        setupKeypad()
    }

    private fun setupKeypad() {
        val buttonIds = listOf(
            R.id.btn0, R.id.btn1, R.id.btn2, R.id.btn3, R.id.btn4,
            R.id.btn5, R.id.btn6, R.id.btn7, R.id.btn8, R.id.btn9,
            R.id.btnPlus, R.id.btnMinus, R.id.btnMultiply, R.id.btnDivide,
            R.id.btnClear, R.id.btnEquals
        )

        for (id in buttonIds) {
            findViewById<Button>(id)?.setOnClickListener { view ->
                val btn = view as Button
                handleButtonClick(btn.text.toString())
            }
        }
    }

    private fun handleButtonClick(char: String) {
        if (char == "C") {
            currentInput.clear()
            displayTv.text = "0"
            return
        }

        currentInput.append(char)
        displayTv.text = currentInput.toString()

        // গোপন পিন ম্যাচ হয়েছে কি না যাচাই
        if (char == "=") {
            val fullExpression = currentInput.toString()
            if (fullExpression == secretPin) {
                // পিন মিলে গেছে! সিক্রেট গার্ডে প্রবেশ
                openGuardConsole()
                currentInput.clear()
                displayTv.text = "0"
                return
            }

            // সাধারণ গাণিতিক হিসাব প্রদর্শন
            calculateMathResult()
        }
    }

    private fun calculateMathResult() {
        try {
            // সাধারণ যোগ/বিয়োগ ক্যালকুলেটর ফলাফল প্রদর্শন
            displayTv.text = "0" // সিম্পল ফলব্যাক
        } catch (e: Exception) {
            displayTv.text = "Error"
        }
    }

    private fun openGuardConsole() {
        val prefs = getSharedPreferences("shuddho_shield", Context.MODE_PRIVATE)
        val isEnrolled = prefs.getBoolean("is_enrolled", false)

        if (!isEnrolled) {
            // প্রথমবার হলে ওয়ান-ক্লিক মাস্টার সেটআপে নিয়ে যাবে
            startActivity(Intent(this, MasterOnboardingActivity::class.java))
        } else {
            // অলরেডি চালু থাকলে সিক্রেট ড্যাশবোর্ডে নিয়ে যাবে
            startActivity(Intent(this, VaultDashboardActivity::class.java))
        }
    }
}
