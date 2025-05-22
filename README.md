# Interactive Soil Yield Surface Visualizer

## Overview/Description

This web application provides interactive 2D and 3D visualizations of common soil constitutive models used in geotechnical engineering. It is designed to help students, educators, and engineers understand the complex behavior of soils under different stress conditions by visualizing their yield surfaces. This tool serves an educational purpose, aiming to make abstract concepts more tangible.

## Features

*   Interactive 3D visualization of yield surfaces in principal stress space ($\sigma_1, \sigma_2, \sigma_3$).
*   2D projections for detailed analysis:
    *   **$\pi$-Plane (Deviatoric Plane) View:** Shows the shape of the yield surface when looking down the hydrostatic axis.
    *   **Meridian Plane ($p-q$) View:** Displays the yield surface in the mean stress ($p$) vs. deviatoric stress ($q$) plane.
*   Support for multiple soil models:
    *   Mohr-Coulomb
    *   Drucker-Prager
*   Adjustable model parameters using intuitive sliders, allowing real-time visualization changes.
*   Dynamic display of mathematical formulations for each model using LaTeX rendering.
*   Built with standard web technologies: HTML, TailwindCSS, and JavaScript.
*   Leverages powerful charting libraries: Plotly.js for 3D plots and Chart.js for 2D plots.

## How to Use

1.  **Access the Application:**
    *   Simply open the `index.html` file in a modern web browser. No installation is required.

2.  **Control Panel:**
    *   **Model Selection:** Choose between "Mohr-Coulomb" and "Drucker-Prager" radio buttons to switch the active soil model.
    *   **Parameter Adjustment:**
        *   For **Mohr-Coulomb:** Adjust `cohesion (c)` and `friction angle ($\phi$)` using the sliders.
        *   For **Drucker-Prager:** Adjust `slope (m)` and `cohesion intercept ($k_d$)` using their respective sliders.
    *   Visualizations (3D plot, $\pi$-plane, and meridian plane) and the mathematical equations displayed will update automatically as you change models or parameters.

3.  **Understanding the Plots:**
    *   **3D View:** Shows the complete yield surface in the 3D principal stress space ($\sigma_1, \sigma_2, \sigma_3$).
    *   **$\pi$-Plane Plot:** A cross-sectional view of the yield surface along the hydrostatic axis ($\sigma_1=\sigma_2=\sigma_3$). It helps visualize the shape of the yield surface in the deviatoric stress plane.
    *   **Meridian Plane Plot:** Shows the relationship between mean stress ($p$) and deviatoric stress ($q$) for triaxial compression and extension paths (for Mohr-Coulomb) or the general yield envelope (for Drucker-Prager).

## Implemented Soil Models

### Mohr-Coulomb

*   **Theoretical Introduction:** The Mohr-Coulomb criterion is a widely used model in soil mechanics that defines the shear strength of soils. It assumes that failure occurs when the shear stress on any plane reaches a value that depends linearly on the normal stress on that same plane.
*   **Yield Function:**
    In principal stress space (compression positive, for $\sigma_1 \ge \sigma_2 \ge \sigma_3$):
    $$ \sigma_1(1-\sin\phi) - \sigma_3(1+\sin\phi) - 2c\cos\phi = 0 $$
    In the $p-q$ plane, for triaxial paths:
    *   Triaxial Compression (TC): $$ q = \frac{6\sin\phi}{3-\sin\phi}p + \frac{6c\cos\phi}{3-\sin\phi} $$
    *   Triaxial Extension (TE): $$ q = \frac{6\sin\phi}{3+\sin\phi}p + \frac{6c\cos\phi}{3+\sin\phi} $$
    Where $c$ is the cohesion and $\phi$ is the angle of internal friction.
*   **Key Characteristics:**
    *   **$\pi$-Plane Shape:** An irregular hexagon. For $\phi=0$ (Tresca criterion), it becomes a regular hexagon.
    *   **3D Shape:** An irregular hexagonal pyramid (if $\phi > 0$) or an irregular hexagonal prism (if $\phi = 0$).

### Drucker-Prager

*   **Theoretical Introduction:** The Drucker-Prager criterion is a smooth, conical approximation of the Mohr-Coulomb yield surface. It avoids the corners present in the Mohr-Coulomb model, which can be numerically advantageous in some computations. It's a pressure-dependent model where the yield stress depends on the mean stress.
*   **Yield Function:**
    A common form is:
    $$ q - m p - k_d = 0 $$
    Where:
    *   $p = \frac{I_1}{3} = \frac{\sigma_1+\sigma_2+\sigma_3}{3}$ is the mean stress.
    *   $q = \sqrt{3J_2} = \sqrt{\frac{1}{2}[(\sigma_1-\sigma_2)^2 + (\sigma_2-\sigma_3)^2 + (\sigma_3-\sigma_1)^2]}$ is the deviatoric stress ($J_2$ is the second invariant of the deviatoric stress tensor).
    *   $m$ and $k_d$ are material parameters. $m$ is related to the friction angle, and $k_d$ is related to cohesion. These parameters can be matched to Mohr-Coulomb parameters in various ways (e.g., matching TC, TE, or an average).
*   **Key Characteristics:**
    *   **$\pi$-Plane Shape:** A circle.
    *   **3D Shape:** A cone. If $m=0$, it becomes a cylinder (von Mises criterion).

## Technologies Used

*   **HTML:** Structure of the web page.
*   **Tailwind CSS:** For styling and responsive design.
*   **JavaScript:** For application logic, interactivity, and calculations.
*   **Plotly.js:** Used for generating interactive 3D visualizations.
*   **Chart.js:** Used for rendering interactive 2D plots ($\pi$-plane and meridian plane).
*   **MathJax:** For displaying mathematical equations using LaTeX.

## Future Enhancements

*   Implementation of more advanced soil models (e.g., Cam Clay, Modified Cam Clay).
*   Functionality to plot user-defined stress paths on the 2D and 3D diagrams.
*   More customization options for plots (e.g., color schemes, plot ranges).
*   Export options for plots (e.g., as PNG or SVG).
*   Displaying stress invariants ($I_1, J_2$) based on slider inputs or specific stress states.

## Contributing

Contributions are welcome! If you have ideas for improvements or new features, please feel free to fork the repository, make your changes, and submit a pull request. You can also open an issue to discuss potential changes.

## License

This project is for educational purposes. No specific license is currently applied.
